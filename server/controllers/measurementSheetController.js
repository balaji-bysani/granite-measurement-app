const pool = require('../config/database');
const { cache } = require('../config/redis');

/**
 * Measurement Sheet Controller
 * Handles CRUD operations for measurement sheets with caching
 */

/**
 * Create a new measurement sheet
 */
const createMeasurementSheet = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { customerId, customerType } = req.body;
    
    // Validation
    if (!customerId || !customerType) {
      return res.status(400).json({
        error: 'Customer ID and customer type are required'
      });
    }
    
    const validCustomerTypes = ['Retail', 'Granite Shops', 'Builders', 'Outstation Parties', 'Exporters'];
    if (!validCustomerTypes.includes(customerType)) {
      return res.status(400).json({
        error: 'Invalid customer type'
      });
    }
    
    // Check if customer exists
    const customerCheck = await client.query('SELECT id FROM customers WHERE id = $1', [customerId]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Customer not found'
      });
    }
    
    const query = `
      INSERT INTO measurement_sheets (customer_id, customer_type)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const result = await client.query(query, [customerId, customerType]);
    const measurementSheet = result.rows[0];
    
    // Cache the new measurement sheet
    await cache.set(`measurement_sheet:${measurementSheet.id}`, measurementSheet, 3600);
    
    // Clear measurement sheet list cache
    await cache.clearPattern('measurement_sheets:*');
    
    res.status(201).json({
      success: true,
      data: measurementSheet
    });
    
  } catch (error) {
    console.error('Error creating measurement sheet:', error);
    res.status(500).json({
      error: 'Failed to create measurement sheet'
    });
  } finally {
    client.release();
  }
};

/**
 * Get all measurement sheets with search and pagination
 */
const getMeasurementSheets = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { 
      search, 
      customerType, 
      status, 
      page = 1, 
      limit = 50,
      startDate,
      endDate
    } = req.query;
    const offset = (page - 1) * limit;
    
    // Create cache key
    const cacheKey = `measurement_sheets:${search || 'all'}:${customerType || 'all'}:${status || 'all'}:${page}:${limit}:${startDate || ''}:${endDate || ''}`;
    
    // Try to get from cache first
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }
    
    let query = `
      SELECT 
        ms.id, ms.measurement_sheet_number, ms.customer_type, 
        ms.total_square_feet, ms.status, ms.created_at, ms.updated_at,
        c.name as customer_name, c.phone_number as customer_phone
      FROM measurement_sheets ms
      JOIN customers c ON ms.customer_id = c.id
    `;
    
    let countQuery = `
      SELECT COUNT(*) 
      FROM measurement_sheets ms
      JOIN customers c ON ms.customer_id = c.id
    `;
    
    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;
    
    // Search functionality - optimized with ILIKE and proper indexing
    if (search && search.trim()) {
      const searchTerm = search.trim();
      conditions.push(`(
        ms.measurement_sheet_number ILIKE $${paramIndex} OR 
        c.name ILIKE $${paramIndex} OR 
        c.phone_number ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${searchTerm}%`);
      paramIndex++;
    }
    
    // Customer type filter
    if (customerType && customerType.trim()) {
      conditions.push(`ms.customer_type = $${paramIndex}`);
      queryParams.push(customerType.trim());
      paramIndex++;
    }
    
    // Status filter
    if (status && status.trim()) {
      conditions.push(`ms.status = $${paramIndex}`);
      queryParams.push(status.trim());
      paramIndex++;
    }
    
    // Date range filters
    if (startDate) {
      conditions.push(`ms.created_at >= $${paramIndex}::date`);
      queryParams.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      conditions.push(`ms.created_at <= $${paramIndex}::date + interval '1 day'`);
      queryParams.push(endDate);
      paramIndex++;
    }
    
    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      query += whereClause;
      countQuery += whereClause;
    }
    
    query += ` ORDER BY ms.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    const [sheetsResult, countResult] = await Promise.all([
      client.query(query, queryParams),
      client.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
    ]);
    
    const measurementSheets = sheetsResult.rows;
    const total = parseInt(countResult.rows[0].count);
    
    const result = {
      success: true,
      data: measurementSheets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
    // Cache the result for 5 minutes
    await cache.set(cacheKey, result, 300);
    
    res.json(result);
    
  } catch (error) {
    console.error('Error fetching measurement sheets:', error);
    res.status(500).json({
      error: 'Failed to fetch measurement sheets'
    });
  } finally {
    client.release();
  }
};

/**
 * Get measurement sheet by ID with slab entries
 */
const getMeasurementSheetById = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    // Try cache first
    const cacheKey = `measurement_sheet_full:${id}`;
    const cachedSheet = await cache.get(cacheKey);
    if (cachedSheet) {
      return res.json({
        success: true,
        data: cachedSheet
      });
    }
    
    // Get measurement sheet with customer details
    const sheetQuery = `
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
    
    const sheetResult = await client.query(sheetQuery, [id]);
    
    if (sheetResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Measurement sheet not found'
      });
    }
    
    const measurementSheet = sheetResult.rows[0];
    
    // Get slab entries
    const slabQuery = `
      SELECT * FROM slab_entries 
      WHERE measurement_sheet_id = $1 
      ORDER BY serial_number
    `;
    
    const slabResult = await client.query(slabQuery, [id]);
    measurementSheet.slab_entries = slabResult.rows;
    
    // Cache the full measurement sheet
    await cache.set(cacheKey, measurementSheet, 1800); // 30 minutes
    
    res.json({
      success: true,
      data: measurementSheet
    });
    
  } catch (error) {
    console.error('Error fetching measurement sheet:', error);
    res.status(500).json({
      error: 'Failed to fetch measurement sheet'
    });
  } finally {
    client.release();
  }
};

/**
 * Update measurement sheet
 */
const updateMeasurementSheet = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const query = `
      UPDATE measurement_sheets 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await client.query(query, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Measurement sheet not found'
      });
    }
    
    const measurementSheet = result.rows[0];
    
    // Update cache
    await cache.set(`measurement_sheet:${id}`, measurementSheet, 3600);
    await cache.del(`measurement_sheet_full:${id}`);
    
    // Clear measurement sheet list cache
    await cache.clearPattern('measurement_sheets:*');
    
    res.json({
      success: true,
      data: measurementSheet
    });
    
  } catch (error) {
    console.error('Error updating measurement sheet:', error);
    res.status(500).json({
      error: 'Failed to update measurement sheet'
    });
  } finally {
    client.release();
  }
};

/**
 * Delete measurement sheet
 */
const deleteMeasurementSheet = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM measurement_sheets WHERE id = $1 RETURNING *';
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Measurement sheet not found'
      });
    }
    
    // Remove from cache
    await cache.del(`measurement_sheet:${id}`);
    await cache.del(`measurement_sheet_full:${id}`);
    
    // Clear measurement sheet list cache
    await cache.clearPattern('measurement_sheets:*');
    
    res.json({
      success: true,
      message: 'Measurement sheet deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting measurement sheet:', error);
    res.status(500).json({
      error: 'Failed to delete measurement sheet'
    });
  } finally {
    client.release();
  }
};

/**
 * Export measurement sheet to PDF
 */
const exportMeasurementSheetToPDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get measurement sheet with full details
    const measurementSheet = await getMeasurementSheetById(req, res);
    
    // For now, return a placeholder response
    // In a real implementation, you would use a PDF library like puppeteer or jsPDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="measurement-sheet-${id}.pdf"`);
    
    // Placeholder PDF content
    const pdfContent = `PDF Export for Measurement Sheet ${id} - Implementation pending`;
    res.send(Buffer.from(pdfContent));
    
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({
      error: 'Failed to export PDF'
    });
  }
};

/**
 * Export measurement sheet to CSV
 */
const exportMeasurementSheetToCSV = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    // Get measurement sheet with slab entries
    const sheetQuery = `
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
    
    const slabQuery = `
      SELECT * FROM slab_entries 
      WHERE measurement_sheet_id = $1 
      ORDER BY serial_number
    `;
    
    const [sheetResult, slabResult] = await Promise.all([
      client.query(sheetQuery, [id]),
      client.query(slabQuery, [id])
    ]);
    
    if (sheetResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Measurement sheet not found'
      });
    }
    
    const sheet = sheetResult.rows[0];
    const slabs = slabResult.rows;
    
    // Generate CSV content
    let csvContent = 'Measurement Sheet Export\n\n';
    csvContent += `Sheet Number,${sheet.measurement_sheet_number}\n`;
    csvContent += `Customer Name,${sheet.customer_name}\n`;
    csvContent += `Customer Type,${sheet.customer_type}\n`;
    csvContent += `Phone,${sheet.customer_phone}\n`;
    csvContent += `Email,${sheet.customer_email || ''}\n`;
    csvContent += `Address,${sheet.customer_address}\n`;
    csvContent += `Created Date,${sheet.created_at}\n`;
    csvContent += `Status,${sheet.status}\n\n`;
    
    csvContent += 'Slab Entries\n';
    csvContent += 'Serial No,Block No,Length,Breadth,Category,Final Length,Final Breadth,Square Feet\n';
    
    slabs.forEach(slab => {
      csvContent += `${slab.serial_number},${slab.block_number},${slab.length},${slab.breadth},${slab.slab_category},${slab.final_length},${slab.final_breadth},${slab.square_feet}\n`;
    });
    
    csvContent += `\nTotal Square Feet,${sheet.total_square_feet || 0}\n`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="measurement-sheet-${id}.csv"`);
    res.send(csvContent);
    
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({
      error: 'Failed to export CSV'
    });
  } finally {
    client.release();
  }
};

module.exports = {
  createMeasurementSheet,
  getMeasurementSheets,
  getMeasurementSheetById,
  updateMeasurementSheet,
  deleteMeasurementSheet,
  exportMeasurementSheetToPDF,
  exportMeasurementSheetToCSV
};