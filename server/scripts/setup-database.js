#!/usr/bin/env node

/**
 * Database setup script
 * Run this script to initialize the database schema
 */

const { initializeDatabase, checkDatabaseStatus } = require('../database/init');
const pool = require('../config/database');

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');
  
  try {
    // Test connection
    console.log('1. Testing database connection...');
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('   ✓ Database connection successful\n');
    
    // Check existing tables
    console.log('2. Checking existing database structure...');
    const existingTables = await checkDatabaseStatus();
    
    if (existingTables.length > 0) {
      console.log(`   ✓ Found existing tables: ${existingTables.join(', ')}`);
      console.log('   ⚠ Database already initialized. Use --force to recreate.\n');
      
      if (!process.argv.includes('--force')) {
        console.log('Database setup complete. No changes made.');
        process.exit(0);
      }
      
      console.log('   🔄 Force flag detected. Recreating database...\n');
    } else {
      console.log('   ℹ No existing tables found. Proceeding with initialization...\n');
    }
    
    // Initialize database
    console.log('3. Initializing database schema...');
    await initializeDatabase();
    console.log('   ✓ Database schema created successfully\n');
    
    // Verify setup
    console.log('4. Verifying database setup...');
    const finalTables = await checkDatabaseStatus();
    console.log(`   ✓ Tables created: ${finalTables.join(', ')}\n`);
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start the server: npm run server');
    console.log('2. Test the API: curl http://localhost:5000/api/health');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure PostgreSQL is running');
    console.error('2. Check your database credentials in .env file');
    console.error('3. Verify the database exists');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Database Setup Script');
  console.log('');
  console.log('Usage: node setup-database.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --force    Recreate database schema even if tables exist');
  console.log('  --help     Show this help message');
  process.exit(0);
}

setupDatabase();