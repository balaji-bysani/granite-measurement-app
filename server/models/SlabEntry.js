/**
 * SlabEntry Model
 * High-performance slab entry data access layer with batch operations
 */

const pool = require('../config/database');
const { cache } = require('../config/redis');

class SlabEntry {
  constructor(data) {
    this.id = data.id;
    this.measurementSheetId = data.measurement_sheet_id;
    this.serialNumber = data.serial_number;
    this.blockNumber = data.block_number;
    this.length = parseFloat(data.length);
    this.breadth = parseFloat(data.breadth);
    this.slabCategory = data.slab_category;
    this.finalLength = parseFloat(data.final_length);
    this.finalBreadth = parseFloat(data.final_breadth);
    this.squareFeet = parseFloat(data.square_feet);
    this.calculationDetails = data.calculation_details;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create a new slab entry with atomic serial number generation
   */
  static async create(slabEntryData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const {
        measurementSheetId,
        blockNumber,
        length,
        breadth,
        slabCategory,
        finalLength,
        finalBreadth,
        squareFeet,
        calculationDetails
      } = slabEntryData;
      
      // Validate measurement sheet exists
      const sheetCheck = await client.query(
        'SELECT id FROM measurement_sheets WHERE id = $1',
        [measurementSheetId]
      );
      
      if (sheetCheck.rows.length === 0) {
        throw new Error('Measurement sheet not found');
      }
      
      // Get next serial number atomically
      const serialQuery = `
        SELECT COALESCE(MAX(serial_number), 0) + 1 as next_serial
        FROM slab_entries 
        WHERE measurement_sheet_id = $1
        FOR UPDATE
      `;
      const serialResult = await client.query(serialQuery, [measurementSheetId]);
      const serialNumber = serialResult.rows[0].next_serial;
      
      // Insert slab entry
      const query = `
        INSERT INTO slab_entries (
          measurement_sheet_id, serial_number, block_number, length, breadth, 
          slab_category, final_length, final_breadth, square_feet, calculation_details
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const result = await client.query(query, [
        measurementSheetId, serialNumber, blockNumber, length, breadth,
        slabCategory, finalLength, finalBreadth, squareFeet, calculationDetails
      ]);
      
      await client.query('COMMIT');
      
      const slabEntry = new SlabEntry(result.rows[0]);
      
      // Clear related caches
      await cache.del(`measurement_sheet_full:${measurementSheetId}`);
      await cache.clearPattern('measurement_sheets:*');
      await cache.clearPattern('slab_entries:*');
      
      return slabEntry;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Batch create slab entries with optimized performance
   */
  static async batchCreate(measurementSheetId, slabEntriesData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Validate measurement sheet exists
      const sheetCheck = await client.query(
        'SELECT id FROM measurement_sheets WHERE id = $1',
        [measurementSheetId]
      );
      
      if (sheetCheck.rows.length === 0) {
        throw new Error('Measurement sheet not found');
      }
      
      // Get current max serial number
      const serialQuery = `
        SELECT COALESCE(MAX(serial_number), 0) as max_serial
        FROM slab_entries 
        WHERE measurement_sheet_id = $1
        FOR UPDATE
      `;
      const serialResult = await client.query(serialQuery, [measurementSheetId]);
      let currentSerial = serialResult.rows[0].max_serial;
      
      // Prepare batch insert with VALUES clause for better performance
      const values = [];
      const params = [];
      let paramIndex = 1;
      
      for (const entryData of slabEntriesData) {
        currentSerial++;
        
        values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9})`);
        
        params.push(
          measurementSheetId,
          currentSerial,
          entryData.blockNumber,
          entryData.length,
          entryData.breadth,
          entryData.slabCategory,
          entryData.finalLength,
          entryData.finalBreadth,
          entryData.squareFeet,
          entryData.calculationDetails
        );
        
        paramIndex += 10;
      }
      
      // Execute batch insert
      const batchQuery = `
        INSERT INTO slab_entries (
          measurement_sheet_id, serial_number, block_number, length, breadth, 
          slab_category, final_length, final_breadth, square_feet, calculation_details
        )
        VALUES ${values.join(', ')}
        RETURNING *
      `;
      
      const result = await client.query(batchQuery, params);
      
      await client.query('COMMIT');
      
      const slabEntries = result.rows.map(row => new SlabEntry(row));
      
      // Clear related caches
      await cache.del(`measurement_sheet_full:${measurementSheetId}`);
      await cache.clearPattern('measurement_sheets:*');
      await cache.clearPattern('slab_entries:*');
      
      return slabEntries;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find slab entry by ID
   */
  static async findById(id) {
    const client = await pool.connect();
    
    try {
      const query = 'SELECT * FROM slab_entries WHERE id = $1';
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new SlabEntry(result.rows[0]);
      
    } finally {
      client.release();
    }
  }

  /**
   * Get all slab entries for a measurement sheet with caching
   */
  static async findByMeasurementSheetId(measurementSheetId, options = {}) {
    const { page, limit } = options;
    const cacheKey = page && limit 
      ? `slab_entries:sheet:${measurementSheetId}:${page}:${limit}`
      : `slab_entries:sheet:${measurementSheetId}:all`;
    
    // Try cache first (cache for 30 minutes)
    const cachedEntries = await cache.get(cacheKey);
    if (cachedEntries) {
      return {
        slabEntries: cachedEntries.slabEntries.map(data => new SlabEntry(data)),
        pagination: cachedEntries.pagination
      };
    }
    
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT * FROM slab_entries 
        WHERE measurement_sheet_id = $1 
        ORDER BY serial_number
      `;
      
      let queryParams = [measurementSheetId];
      let pagination = null;
      
      // Add pagination if requested
      if (page && limit) {
        const offset = (page - 1) * limit;
        query += ` LIMIT $2 OFFSET $3`;
        queryParams.push(limit, offset);
        
        // Get total count for pagination
        const countQuery = 'SELECT COUNT(*) FROM slab_entries WHERE measurement_sheet_id = $1';
        const countResult = await client.query(countQuery, [measurementSheetId]);
        const total = parseInt(countResult.rows[0].count);
        
        pagination = {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        };
      }
      
      const result = await client.query(query, queryParams);
      const slabEntries = result.rows.map(row => new SlabEntry(row));
      
      const response = {
        slabEntries: result.rows, // Store raw data for caching
        pagination
      };
      
      // Cache for 30 minutes
      await cache.set(cacheKey, response, 1800);
      
      return {
        slabEntries,
        pagination
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * Update slab entry with cache management
   */
  async update(updateData) {
    const client = await pool.connect();
    
    try {
      const {
        blockNumber,
        length,
        breadth,
        slabCategory,
        finalLength,
        finalBreadth,
        squareFeet,
        calculationDetails
      } = updateData;
      
      const query = `
        UPDATE slab_entries 
        SET 
          block_number = COALESCE($1, block_number),
          length = COALESCE($2, length),
          breadth = COALESCE($3, breadth),
          slab_category = COALESCE($4, slab_category),
          final_length = COALESCE($5, final_length),
          final_breadth = COALESCE($6, final_breadth),
          square_feet = COALESCE($7, square_feet),
          calculation_details = COALESCE($8, calculation_details),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *
      `;
      
      const result = await client.query(query, [
        blockNumber, length, breadth, slabCategory,
        finalLength, finalBreadth, squareFeet, calculationDetails, this.id
      ]);
      
      if (result.rows.length === 0) {
        throw new Error('Slab entry not found');
      }
      
      // Update instance properties
      const updatedData = result.rows[0];
      Object.assign(this, {
        blockNumber: updatedData.block_number,
        length: parseFloat(updatedData.length),
        breadth: parseFloat(updatedData.breadth),
        slabCategory: updatedData.slab_category,
        finalLength: parseFloat(updatedData.final_length),
        finalBreadth: parseFloat(updatedData.final_breadth),
        squareFeet: parseFloat(updatedData.square_feet),
        calculationDetails: updatedData.calculation_details,
        updatedAt: updatedData.updated_at
      });
      
      // Clear related caches
      await cache.del(`measurement_sheet_full:${this.measurementSheetId}`);
      await cache.clearPattern('measurement_sheets:*');
      await cache.clearPattern(`slab_entries:sheet:${this.measurementSheetId}:*`);
      
      return this;
      
    } finally {
      client.release();
    }
  }

  /**
   * Batch update slab entries for better performance
   */
  static async batchUpdate(updates) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const updatedEntries = [];
      const affectedSheets = new Set();
      
      for (const update of updates) {
        const { id, ...updateData } = update;
        
        const query = `
          UPDATE slab_entries 
          SET 
            block_number = COALESCE($1, block_number),
            length = COALESCE($2, length),
            breadth = COALESCE($3, breadth),
            slab_category = COALESCE($4, slab_category),
            final_length = COALESCE($5, final_length),
            final_breadth = COALESCE($6, final_breadth),
            square_feet = COALESCE($7, square_feet),
            calculation_details = COALESCE($8, calculation_details),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $9
          RETURNING *
        `;
        
        const result = await client.query(query, [
          updateData.blockNumber,
          updateData.length,
          updateData.breadth,
          updateData.slabCategory,
          updateData.finalLength,
          updateData.finalBreadth,
          updateData.squareFeet,
          updateData.calculationDetails,
          id
        ]);
        
        if (result.rows.length > 0) {
          const slabEntry = new SlabEntry(result.rows[0]);
          updatedEntries.push(slabEntry);
          affectedSheets.add(slabEntry.measurementSheetId);
        }
      }
      
      await client.query('COMMIT');
      
      // Clear related caches for all affected measurement sheets
      for (const sheetId of affectedSheets) {
        await cache.del(`measurement_sheet_full:${sheetId}`);
        await cache.clearPattern(`slab_entries:sheet:${sheetId}:*`);
      }
      await cache.clearPattern('measurement_sheets:*');
      
      return updatedEntries;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete slab entry with proper cleanup
   */
  async delete() {
    const client = await pool.connect();
    
    try {
      const query = 'DELETE FROM slab_entries WHERE id = $1 RETURNING measurement_sheet_id';
      const result = await client.query(query, [this.id]);
      
      if (result.rows.length === 0) {
        throw new Error('Slab entry not found');
      }
      
      const measurementSheetId = result.rows[0].measurement_sheet_id;
      
      // Clear related caches
      await cache.del(`measurement_sheet_full:${measurementSheetId}`);
      await cache.clearPattern('measurement_sheets:*');
      await cache.clearPattern(`slab_entries:sheet:${measurementSheetId}:*`);
      
      return true;
      
    } finally {
      client.release();
    }
  }

  /**
   * Batch delete slab entries
   */
  static async batchDelete(ids) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get affected measurement sheet IDs before deletion
      const sheetQuery = `
        SELECT DISTINCT measurement_sheet_id 
        FROM slab_entries 
        WHERE id = ANY($1)
      `;
      const sheetResult = await client.query(sheetQuery, [ids]);
      const affectedSheets = sheetResult.rows.map(row => row.measurement_sheet_id);
      
      // Delete slab entries
      const deleteQuery = 'DELETE FROM slab_entries WHERE id = ANY($1) RETURNING id';
      const deleteResult = await client.query(deleteQuery, [ids]);
      
      await client.query('COMMIT');
      
      // Clear related caches for all affected measurement sheets
      for (const sheetId of affectedSheets) {
        await cache.del(`mea