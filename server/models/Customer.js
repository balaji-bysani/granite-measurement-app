/**
 * Customer Model
 * High-performance customer data access layer with PostgreSQL optimization
 */

const pool = require('../config/database');
const { cache } = require('../config/redis');

class Customer {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.phoneNumber = data.phone_number;
    this.email = data.email;
    this.address = data.address;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create a new customer with optimized database insertion
   */
  static async create(customerData) {
    const client = await pool.connect();
    
    try {
      const { name, phoneNumber, email, address } = customerData;
      
      // Use prepared statement for better performance
      const query = `
        INSERT INTO customers (name, phone_number, email, address)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const result = await client.query(query, [name, phoneNumber, email, address]);
      const customer = new Customer(result.rows[0]);
      
      // Cache the new customer for 1 hour
      await cache.set(`customer:${customer.id}`, customer, 3600);
      
      // Clear related caches
      await cache.clearPattern('customers:*');
      await cache.clearPattern('customer_search:*');
      
      return customer;
      
    } finally {
      client.release();
    }
  }

  /**
   * Find customer by ID with caching
   */
  static async findById(id) {
    // Try cache first
    const cachedCustomer = await cache.get(`customer:${id}`);
    if (cachedCustomer) {
      return new Customer(cachedCustomer);
    }
    
    const client = await pool.connect();
    
    try {
      // Use index on primary key for fast lookup
      const query = 'SELECT * FROM customers WHERE id = $1';
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const customer = new Customer(result.rows[0]);
      
      // Cache for 1 hour
      await cache.set(`customer:${id}`, customer, 3600);
      
      return customer;
      
    } finally {
      client.release();
    }
  }

  /**
   * Search customers with optimized full-text search and caching
   */
  static async search(searchTerm, options = {}) {
    const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * limit;
    
    // Create cache key
    const cacheKey = `customer_search:${searchTerm || 'all'}:${page}:${limit}:${sortBy}:${sortOrder}`;
    
    // Try cache first (cache for 5 minutes for search results)
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      return {
        customers: cachedResult.customers.map(data => new Customer(data)),
        pagination: cachedResult.pagination
      };
    }
    
    const client = await pool.connect();
    
    try {
      let query, countQuery, queryParams, countParams;
      
      if (searchTerm && searchTerm.trim()) {
        // Use full-text search with GIN index for better performance
        query = `
          SELECT * FROM customers 
          WHERE to_tsvector('english', name) @@ plainto_tsquery('english', $1)
             OR phone_number ILIKE $2
             OR email ILIKE $2
          ORDER BY ${sortBy} ${sortOrder}
          LIMIT $3 OFFSET $4
        `;
        
        countQuery = `
          SELECT COUNT(*) FROM customers 
          WHERE to_tsvector('english', name) @@ plainto_tsquery('english', $1)
             OR phone_number ILIKE $2
             OR email ILIKE $2
        `;
        
        const likePattern = `%${searchTerm.trim()}%`;
        queryParams = [searchTerm.trim(), likePattern, limit, offset];
        countParams = [searchTerm.trim(), likePattern];
      } else {
        // Get all customers with pagination
        query = `
          SELECT * FROM customers 
          ORDER BY ${sortBy} ${sortOrder}
          LIMIT $1 OFFSET $2
        `;
        
        countQuery = 'SELECT COUNT(*) FROM customers';
        
        queryParams = [limit, offset];
        countParams = [];
      }
      
      // Execute both queries in parallel for better performance
      const [customersResult, countResult] = await Promise.all([
        client.query(query, queryParams),
        client.query(countQuery, countParams)
      ]);
      
      const customers = customersResult.rows.map(row => new Customer(row));
      const total = parseInt(countResult.rows[0].count);
      
      const result = {
        customers: customers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
      
      // Cache search results for 5 minutes
      await cache.set(cacheKey, {
        customers: customersResult.rows, // Store raw data for caching
        pagination: result.pagination
      }, 300);
      
      return result;
      
    } finally {
      client.release();
    }
  }

  /**
   * Update customer with optimized query and cache management
   */
  async update(updateData) {
    const client = await pool.connect();
    
    try {
      const { name, phoneNumber, email, address } = updateData;
      
      const query = `
        UPDATE customers 
        SET name = $1, phone_number = $2, email = $3, address = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `;
      
      const result = await client.query(query, [name, phoneNumber, email, address, this.id]);
      
      if (result.rows.length === 0) {
        throw new Error('Customer not found');
      }
      
      // Update instance properties
      const updatedData = result.rows[0];
      this.name = updatedData.name;
      this.phoneNumber = updatedData.phone_number;
      this.email = updatedData.email;
      this.address = updatedData.address;
      this.updatedAt = updatedData.updated_at;
      
      // Update cache
      await cache.set(`customer:${this.id}`, this, 3600);
      
      // Clear related caches
      await cache.clearPattern('customers:*');
      await cache.clearPattern('customer_search:*');
      
      return this;
      
    } finally {
      client.release();
    }
  }

  /**
   * Delete customer with proper cache cleanup
   */
  async delete() {
    const client = await pool.connect();
    
    try {
      // Check if customer has measurement sheets
      const checkQuery = 'SELECT COUNT(*) FROM measurement_sheets WHERE customer_id = $1';
      const checkResult = await client.query(checkQuery, [this.id]);
      const measurementSheetCount = parseInt(checkResult.rows[0].count);
      
      if (measurementSheetCount > 0) {
        throw new Error('Cannot delete customer with existing measurement sheets');
      }
      
      const query = 'DELETE FROM customers WHERE id = $1 RETURNING *';
      const result = await client.query(query, [this.id]);
      
      if (result.rows.length === 0) {
        throw new Error('Customer not found');
      }
      
      // Remove from cache
      await cache.del(`customer:${this.id}`);
      
      // Clear related caches
      await cache.clearPattern('customers:*');
      await cache.clearPattern('customer_search:*');
      
      return true;
      
    } finally {
      client.release();
    }
  }

  /**
   * Get frequently accessed customers (cached)
   */
  static async getFrequentlyAccessed(limit = 10) {
    const cacheKey = `customers:frequently_accessed:${limit}`;
    
    // Try cache first (cache for 30 minutes)
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult.map(data => new Customer(data));
    }
    
    const client = await pool.connect();
    
    try {
      // Get customers with most recent measurement sheets
      const query = `
        SELECT DISTINCT c.*, COUNT(ms.id) as sheet_count
        FROM customers c
        LEFT JOIN measurement_sheets ms ON c.id = ms.customer_id
        GROUP BY c.id, c.name, c.phone_number, c.email, c.address, c.created_at, c.updated_at
        ORDER BY sheet_count DESC, c.updated_at DESC
        LIMIT $1
      `;
      
      const result = await client.query(query, [limit]);
      const customers = result.rows.map(row => new Customer(row));
      
      // Cache for 30 minutes
      await cache.set(cacheKey, result.rows, 1800);
      
      return customers;
      
    } finally {
      client.release();
    }
  }

  /**
   * Get customer statistics
   */
  static async getStatistics() {
    const cacheKey = 'customers:statistics';
    
    // Try cache first (cache for 15 minutes)
    const cachedStats = await cache.get(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }
    
    const client = await pool.connect();
    
    try {
      const queries = [
        'SELECT COUNT(*) as total_customers FROM customers',
        'SELECT COUNT(*) as new_customers_today FROM customers WHERE DATE(created_at) = CURRENT_DATE',
        'SELECT COUNT(*) as new_customers_week FROM customers WHERE created_at >= CURRENT_DATE - INTERVAL \'7 days\'',
        `SELECT COUNT(*) as active_customers FROM customers c 
         WHERE EXISTS (SELECT 1 FROM measurement_sheets ms WHERE ms.customer_id = c.id)`
      ];
      
      const results = await Promise.all(queries.map(query => client.query(query)));
      
      const statistics = {
        totalCustomers: parseInt(results[0].rows[0].total_customers),
        newCustomersToday: parseInt(results[1].rows[0].new_customers_today),
        newCustomersThisWeek: parseInt(results[2].rows[0].new_customers_week),
        activeCustomers: parseInt(results[3].rows[0].active_customers)
      };
      
      // Cache for 15 minutes
      await cache.set(cacheKey, statistics, 900);
      
      return statistics;
      
    } finally {
      client.release();
    }
  }

  /**
   * Validate customer data
   */
  static validateData(data) {
    const errors = [];
    
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    }
    
    if (!data.phoneNumber || typeof data.phoneNumber !== 'string' || data.phoneNumber.trim().length === 0) {
      errors.push('Phone number is required and must be a non-empty string');
    }
    
    if (!data.address || typeof data.address !== 'string' || data.address.trim().length === 0) {
      errors.push('Address is required and must be a non-empty string');
    }
    
    if (data.email && (typeof data.email !== 'string' || !data.email.includes('@'))) {
      errors.push('Email must be a valid email address');
    }
    
    return errors;
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      phoneNumber: this.phoneNumber,
      email: this.email,
      address: this.address,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Customer;