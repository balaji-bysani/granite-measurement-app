const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

/**
 * Initialize the database with schema and indexes
 */
async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Initializing database schema...');
    
    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schema);
    
    console.log('Database schema initialized successfully');
    console.log('Tables created: customers, measurement_sheets, slab_entries');
    console.log('Indexes created for optimized search performance');
    console.log('Triggers created for automatic calculations');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if database tables exist
 */
async function checkDatabaseStatus() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('customers', 'measurement_sheets', 'slab_entries')
    `);
    
    return result.rows.map(row => row.table_name);
  } catch (error) {
    console.error('Error checking database status:', error);
    return [];
  } finally {
    client.release();
  }
}

module.exports = {
  initializeDatabase,
  checkDatabaseStatus
};