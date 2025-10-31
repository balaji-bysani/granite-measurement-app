const pool = require('../config/database');
const { cache } = require('../config/redis');

/**
 * Slab Entry Controller
 * Handles CRUD operations for slab entries with caching
 */

/**
 * Create a new slab entry
 */
const createSlabEntry = async (req, res) => {
  const client = await pool.connect();
  
  try {
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
    } = req.body;
    
    // Validation
    if (!measurementSheetId || !blockNumber || !length || !breadth || !slabCategory) {
      return res.status(400).json({
        error: 'Measurement sheet ID, block number, length, breadth, and slab category are required'
      });
    }
    
    if (length <= 0 || breadth <= 0) {
      return res.status(400).json({
        error: 'Length and breadth must be positive numbers'
      });
    }
    
    const validCategories = ['F', 'LD', 'D', 'S'];
    if (!validCategories.includes(slabCategory)) {
      return res.status(400).json({
        error: 'Invalid slab category'
      });
    }
    
    // Check if measurement sheet exists
    const sheetCheck = await client.query('SELECT id FROM measurement_sheets WHERE id = $1', [measurementSheetId]);
    if (sheetCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Measurement sheet not found'
      });
    }
    
    // Get next serial number for this measurement sheet
    const serialQuery = `
      SELECT COALESCE(MAX(serial_number), 0) + 1 as next_serial
      FROM slab_entries 
      WHERE measurement_sheet_id = $1
    `;
    const serialResult = await client.query(serialQuery, [measurementSheetId]);
    const serialNumber = serialResult.rows[0].next_serial;
    
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
    
    const slabEntry = result.rows[0];
    
    // Clear related caches
    await cache.del(`measurement_sheet_full:${measurementSheetId}`);
    await cache.clearPattern('measurement_sheets:*');
    
    res.status(201).json({
      success: true,
      data: slabEntry
    });
    
  } catch (error) {
    console.error('Error creating slab entry:', error);
    res.status(500).json({
      error: 'Failed to create slab entry'
    });
  } finally {
    client.release();
  }
};

/**
 * Get slab entries for a measurement sheet
 */
const getSlabEntries = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { measurementSheetId } = req.params;
    
    const query = `
      SELECT * FROM slab_entries 
      WHERE measurement_sheet_id = $1 
      ORDER BY serial_number
    `;
    
    const result = await client.query(query, [measurementSheetId]);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching slab entries:', error);
    res.status(500).json({
      error: 'Failed to fetch slab entries'
    });
  } finally {
    client.release();
  }
};

/**
 * Get slab entry by ID
 */
const getSlabEntryById = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    const query = 'SELECT * FROM slab_entries WHERE id = $1';
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Slab entry not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching slab entry:', error);
    res.status(500).json({
      error: 'Failed to fetch slab entry'
    });
  } finally {
    client.release();
  }
};

/**
 * Update slab entry
 */
const updateSlabEntry = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { 
      blockNumber, 
      length, 
      breadth, 
      slabCategory,
      finalLength,
      finalBreadth,
      squareFeet,
      calculationDetails
    } = req.body;
    
    // Validation
    if (length <= 0 || breadth <= 0) {
      return res.status(400).json({
        error: 'Length and breadth must be positive numbers'
      });
    }
    
    const validCategories = ['F', 'LD', 'D', 'S'];
    if (slabCategory && !validCategories.includes(slabCategory)) {
      return res.status(400).json({
        error: 'Invalid slab category'
      });
    }
    
    const query = `
      UPDATE slab_entries 
      SET 
        block_number = $1, 
        length = $2, 
        breadth = $3, 
        slab_category = $4,
        final_length = $5,
        final_breadth = $6,
        square_feet = $7,
        calculation_details = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `;
    
    const result = await client.query(query, [
      blockNumber, length, breadth, slabCategory,
      finalLength, finalBreadth, squareFeet, calculationDetails, id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Slab entry not found'
      });
    }
    
    const slabEntry = result.rows[0];
    
    // Clear related caches
    await cache.del(`measurement_sheet_full:${slabEntry.measurement_sheet_id}`);
    await cache.clearPattern('measurement_sheets:*');
    
    res.json({
      success: true,
      data: slabEntry
    });
    
  } catch (error) {
    console.error('Error updating slab entry:', error);
    res.status(500).json({
      error: 'Failed to update slab entry'
    });
  } finally {
    client.release();
  }
};

/**
 * Delete slab entry
 */
const deleteSlabEntry = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM slab_entries WHERE id = $1 RETURNING measurement_sheet_id';
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Slab entry not found'
      });
    }
    
    const measurementSheetId = result.rows[0].measurement_sheet_id;
    
    // Clear related caches
    await cache.del(`measurement_sheet_full:${measurementSheetId}`);
    await cache.clearPattern('measurement_sheets:*');
    
    res.json({
      success: true,
      message: 'Slab entry deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting slab entry:', error);
    res.status(500).json({
      error: 'Failed to delete slab entry'
    });
  } finally {
    client.release();
  }
};

/**
 * Batch create slab entries
 */
const batchCreateSlabEntries = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { measurementSheetId, slabEntries } = req.body;
    
    if (!measurementSheetId || !Array.isArray(slabEntries) || slabEntries.length === 0) {
      return res.status(400).json({
        error: 'Measurement sheet ID and slab entries array are required'
      });
    }
    
    // Check if measurement sheet exists
    const sheetCheck = await client.query('SELECT id FROM measurement_sheets WHERE id = $1', [measurementSheetId]);
    if (sheetCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Measurement sheet not found'
      });
    }
    
    await client.query('BEGIN');
    
    const createdEntries = [];
    
    for (let i = 0; i < slabEntries.length; i++) {
      const entry = slabEntries[i];
      
      // Get next serial number
      const serialQuery = `
        SELECT COALESCE(MAX(serial_number), 0) + 1 as next_serial
        FROM slab_entries 
        WHERE measurement_sheet_id = $1
      `;
      const serialResult = await client.query(serialQuery, [measurementSheetId]);
      const serialNumber = serialResult.rows[0].next_serial;
      
      const query = `
        INSERT INTO slab_entries (
          measurement_sheet_id, serial_number, block_number, length, breadth, 
          slab_category, final_length, final_breadth, square_feet, calculation_details
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const result = await client.query(query, [
        measurementSheetId, serialNumber, entry.blockNumber, entry.length, entry.breadth,
        entry.slabCategory, entry.finalLength, entry.finalBreadth, entry.squareFeet, entry.calculationDetails
      ]);
      
      createdEntries.push(result.rows[0]);
    }
    
    await client.query('COMMIT');
    
    // Clear related caches
    await cache.del(`measurement_sheet_full:${measurementSheetId}`);
    await cache.clearPattern('measurement_sheets:*');
    
    res.status(201).json({
      success: true,
      data: createdEntries
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error batch creating slab entries:', error);
    res.status(500).json({
      error: 'Failed to create slab entries'
    });
  } finally {
    client.release();
  }
};

module.exports = {
  createSlabEntry,
  getSlabEntries,
  getSlabEntryById,
  updateSlabEntry,
  deleteSlabEntry,
  batchCreateSlabEntries
};