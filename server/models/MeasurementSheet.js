/**
 * MeasurementSheet Model
 * High-performance measurement sheet data access layer with PostgreSQL optimization
 */

const pool = require('../config/database');
const { cache } = require('../config/redis');

class MeasurementSheet {
  constructor(data) {
    this.id = data.id;
    this.measurementSheetNumber = data.measurement_sheet_number;
    this.customerId = data.customer_id;
    this.customerType = data.customer_type;
    this.totalSquareFeet = parseFloat(data.total_square_feet) || 0;
    this.status = data.status;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    
    // Additional fields from joins
    this.customerName = data.customer_name;
    this.customerPhone = data.customer_phone;
    this.customerEmail = data.customer_email;
    this.customerAddress = data.customer_address;
    this.slabEntries = data.slab_entries || [];
  }

  /**
   * Create a new measurement sheet with atomic sequential number generation
   */
  static async create(measurementSheetData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { customerId, customerType } = measurementSheetData;
      
      // Validate customer type
      const validCustomerTypes = ['Retail', 'Granite Shops', 'Builders', 'Outstation Parties', 'Exporters'];
      if (!validCustomerTypes.includes(customerType)) {
        throw new Error('Invalid customer type');
      }
      
      // Verify customer exists
      const customerCheck = await client.query(
        'SELECT id, name FROM customers WHERE id = $1',
        [customerId]
      );
      
      if (customerCheck.rows.length === 0) {
        throw new Error('Customer not found');
      }
      
      // Create measurement sheet with atomic sequential number generation
      const query = `
        INSERT INTO measurement_sheets (customer_id, customer_type, status)
        VALUES ($1, $2, 'draft')
        RETURNING *
      `;
      
      const result = await client.query(query, [customerId, customerType]);
      const measurementSheetData = result.rows[0];
      
      await client.query('COMMIT');
      
      const measurementSheet = new MeasurementSheet(measurementSheetData);
      
      // Cache the new measurement sheet for 1 hour
      await cache.set(`measurement_sheet:${measurementSheet.id}`, measurementSheet, 3600);
      
      // Clear related caches
      await cache.clearPattern('measurement_sheets:*');
      await cache.clearPattern('measurement_sheet_stats:*');
      
      return measurementSheet;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find measurement sheet by ID with optimized caching
   */
  static async findById(id, includeSlabEntries = false) {
    const cacheKey = includeSlabEntries ? `measurement_sheet_full:${id}` : `measurement_sheet:${id}`;
    
    // Try cache first
    const cachedSheet = await cache.get(cacheKey);
    if (cachedSheet) {
      return new MeasurementSheet(cachedSheet);
    }
    
    const client = await pool.connect();
    
    try {
      // Get measurement sheet with customer details using optimized join
      const query = `
        SELECT 
          ms.*, 
          c.name as customer_name, 
          c.phone_number as customer_phone,
          c.email as customer_email,
          c.address as customer_address
        FROM measurement_sheets ms
        JOIN customers c ON ms.customer_id = c.id
        WHERE ms.id = $1
      `;
      
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const measurementSheetData = result.rows[0];
      
      // Get slab entries if requested
      if (includeSlabEntries) {
        const slabQuery = `
          SELECT * FROM slab_entries 
          WHERE measurement_sheet_id = $1 
          ORDER BY serial_number
        `;
        
        const slabResult = await client.query(slabQuery, [id]);
        measurementSheetData.slab_entries = slabResult.rows;
      }
      
      const measurementSheet = new MeasurementSheet(measurementSheetData);
      
      // Cache for 30 minutes (full) or 1 hour (basic)
      const cacheTime = includeSlabEntries ? 1800 : 3600;
      await cache.set(cacheKey, measurementSheetData, cacheTime);
      
      return measurementSheet;
      
    } finally {
      client.release();
    }
  }

  /**
   * Search measurement sheets with advanced filtering and pagination optimization
   */
  static async search(searchOptions = {}) {
    const {
      search,
      customerType,
      status,
      startDate,
      endDate,
      blockNumber,
      page = 1,
      limit = 50,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = searchOptions;
    
    const offset = (page - 1) * limit;
    
    // Create comprehensive cache key
    const cacheKey = `measurement_sheets:search:${JSON.stringify(searchOptions)}`;
    
    // Try cache first (cache for 5 minutes for search results)
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      return {
        measurementSheets: cachedResult.measurementSheets.map(data => new MeasurementSheet(data)),
        pagination: cachedResult.pagination
      };
    }
    
    const client = await pool.connect();
    
    try {
      let baseQuery = `
        FROM measurement_sheets ms
        JOIN customers c ON ms.customer_id = c.id
      `;
      
      let selectQuery = `
        SELECT 
          ms.id, ms.measurement_sheet_number, ms.customer_type, 
          ms.total_square_feet, ms.status, ms.created_at, ms.updated_at,
          c.name as customer_name, c.phone_number as customer_phone
        ${baseQuery}
      `;
      
      let countQuery = `SELECT COUNT(*) ${baseQuery}`;
      
      const conditions = [];
      const queryParams = [];
      let paramIndex = 1;
      
      // Text search across multiple fields
      if (search && search.trim()) {
        conditions.push(`(
          ms.measurement_sheet_number ILIKE $${paramIndex} OR 
          c.name ILIKE $${paramIndex} OR 
          c.phone_number ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${search.trim()}%`);
        paramIndex++;
      }
      
      // Customer type filter
      if (customerType) {
        conditions.push(`ms.customer_type = $${paramIndex}`);
        queryParams.push(customerType);
        paramIndex++;
      }
      
      // Status filter
      if (status) {
        conditions.push(`ms.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }
      
      // Date range filters
      if (startDate) {
        conditions.push(`ms.created_at >= $${paramIndex}`);
        queryParams.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        conditions.push(`ms.created_at <= $${paramIndex}`);
        queryParams.push(endDate);
        paramIndex++;
      }
      
      // Block number search (requires join with slab_entries)
      if (blockNumber) {
        baseQuery += ` LEFT JOIN slab_entries se ON ms.id = se.measurement_sheet_id`;
        conditions.push(`se.block_number ILIKE $${paramIndex}`);
        queryParams.push(`%${blockNumber}%`);
        paramIndex++;
        
        // Add DISTINCT to avoid duplicates when joining with slab_entries
        selectQuery = selectQuery.replace('SELECT', 'SELECT DISTINCT');
      }
      
      // Apply WHERE conditions
      if (conditions.length > 0) {
        const whereClause = ` WHERE ${conditions.join(' AND ')}`;
        selectQuery += whereClause;
        countQuery += whereClause;
      }
      
      // Add sorting and pagination
      const validSortColumns = ['created_at', 'updated_at', 'measurement_sheet_number', 'customer_name', 'total_square_feet'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
      const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      selectQuery += ` ORDER BY ${sortColumn === 'customer_name' ? 'c.name' : 'ms.' + sortColumn} ${order}`;
      selectQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);
      
      // Execute queries in parallel for better performance
      const [sheetsResult, countResult] = await Promise.all([
        client.query(selectQuery, queryParams),
        client.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
      ]);
      
      const measurementSheets = sheetsResult.rows;
      const total = parseInt(countResult.rows[0].count);
      
      const result = {
        measurementSheets: measurementSheets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
      
      // Cache search results for 5 minutes
      await cache.set(cacheKey, result, 300);
      
      return {
        measurementSheets: result.measurementSheets.map(data => new MeasurementSheet(data)),
        pagination: result.pagination
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * Update measurement sheet with optimized cache management
   */
  async update(updateData) {
    const client = await pool.connect();
    
    try {
      const { status } = updateData;
      
      // Validate status if provided
      if (status && !['draft', 'completed'].includes(status)) {
        throw new Error('Invalid status. Must be "draft" or "completed"');
      }
      
      const query = `
        UPDATE measurement_sheets 
        SET status = COALESCE($1, status), updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await client.query(query, [status, this.id]);
      
      if (result.rows.length === 0) {
        throw new Error('Measurement sheet not found');
      }
      
      // Update instance properties
      const updatedData = result.rows[0];
      this.status = updatedData.status;
      this.updatedAt = updatedData.updated_at;
      
      // Update caches
      await cache.set(`measurement_sheet:${this.id}`, this, 3600);
      await cache.del(`measurement_sheet_full:${this.id}`);
      
      // Clear related caches
      await cache.clearPattern('measurement_sheets:*');
      
      return this;
      
    } finally {
      client.release();
    }
  }

  /**
   * Delete measurement sheet with proper cleanup
   */
  async delete() {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete slab entries first (cascade should handle this, but explicit for clarity)
      await client.query('DELETE FROM slab_entries WHERE measurement_sheet_id = $1', [this.id]);
      
      // Delete measurement sheet
      const query = 'DELETE FROM measurement_sheets WHERE id = $1 RETURNING *';
      const result = await client.query(query, [this.id]);
      
      if (result.rows.length === 0) {
        throw new Error('Measurement sheet not found');
      }
      
      await client.query('COMMIT');
      
      // Remove from caches
      await cache.del(`measurement_sheet:${this.id}`);
      await cache.del(`measurement_sheet_full:${this.id}`);
      
      // Clear related caches
      await cache.clearPattern('measurement_sheets:*');
      await cache.clearPattern('measurement_sheet_stats:*');
      
      return true;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get measurement sheet statistics with caching
   */
  static async getStatistics() {
    const cacheKey = 'measurement_sheet_stats:overview';
    
    // Try cache first (cache for 15 minutes)
    const cachedStats = await cache.get(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }
    
    const client = await pool.connect();
    
    try {
      const queries = [
        'SELECT COUNT(*) as total_sheets FROM measurement_sheets',
        'SELECT COUNT(*) as draft_sheets FROM measurement_sheets WHERE status = \'draft\'',
        'SELECT COUNT(*) as completed_sheets FROM measurement_sheets WHERE status = \'completed\'',
        'SELECT COUNT(*) as sheets_today FROM measurement_sheets WHERE DATE(created_at) = CURRENT_DATE',
        'SELECT COUNT(*) as sheets_this_week FROM measurement_sheets WHERE created_at >= CURRENT_DATE - INTERVAL \'7 days\'',
        'SELECT COALESCE(SUM(total_square_feet), 0) as total_square_feet FROM measurement_sheets WHERE status = \'completed\'',
        `SELECT customer_type, COUNT(*) as count 
         FROM measurement_sheets 
         GROUP BY customer_type 
         ORDER BY count DESC`
      ];
      
      const results = await Promise.all(queries.map(query => client.query(query)));
      
      const statistics = {
        totalSheets: parseInt(results[0].rows[0].total_sheets),
        draftSheets: parseInt(results[1].rows[0].draft_sheets),
        completedSheets: parseInt(results[2].rows[0].completed_sheets),
        sheetsToday: parseInt(results[3].rows[0].sheets_today),
        sheetsThisWeek: parseInt(results[4].rows[0].sheets_this_week),
        totalSquareFeet: parseFloat(results[5].rows[0].total_square_feet),
        customerTypeBreakdown: results[6].rows.map(row => ({
          customerType: row.customer_type,
          count: parseInt(row.count)
        }))
      };
      
      // Cache for 15 minutes
      await cache.set(cacheKey, statistics, 900);
      
      return statistics;
      
    } finally {
      client.release();
    }
  }

  /**
   * Get recent measurement sheets with caching
   */
  static async getRecent(limit = 10) {
    const cacheKey = `measurement_sheets:recent:${limit}`;
    
    // Try cache first (cache for 10 minutes)
    const cachedSheets = await cache.get(cacheKey);
    if (cachedSheets) {
      return cachedSheets.map(data => new MeasurementSheet(data));
    }
    
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          ms.*, 
          c.name as customer_name, 
          c.phone_number as customer_phone
        FROM measurement_sheets ms
        JOIN customers c ON ms.customer_id = c.id
        ORDER BY ms.created_at DESC
        LIMIT $1
      `;
      
      const result = await client.query(query, [limit]);
      const measurementSheets = result.rows.map(row => new MeasurementSheet(row));
      
      // Cache for 10 minutes
      await cache.set(cacheKey, result.rows, 600);
      
      return measurementSheets;
      
    } finally {
      client.release();
    }
  }

  /**
   * Validate measurement sheet data
   */
  static validateData(data) {
    const errors = [];
    
    if (!data.customerId || typeof data.customerId !== 'string') {
      errors.push('Customer ID is required and must be a valid UUID');
    }
    
    if (!data.customerType || typeof data.customerType !== 'string') {
      errors.push('Customer type is required');
    }
    
    const validCustomerTypes = ['Retail', 'Granite Shops', 'Builders', 'Outstation Parties', 'Exporters'];
    if (data.customerType && !validCustomerTypes.includes(data.customerType)) {
      errors.push('Invalid customer type. Must be one of: ' + validCustomerTypes.join(', '));
    }
    
    if (data.status && !['draft', 'completed'].includes(data.status)) {
      errors.push('Invalid status. Must be "draft" or "completed"');
    }
    
    return errors;
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      id: this.id,
      measurementSheetNumber: this.measurementSheetNumber,
      customerId: this.customerId,
      customerType: this.customerType,
      totalSquareFeet: this.totalSquareFeet,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      customerEmail: this.customerEmail,
      customerAddress: this.customerAddress,
      slabEntries: this.slabEntries
    };
  }
}

module.exports = MeasurementSheet;