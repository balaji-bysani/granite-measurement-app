-- Granite Measurement System Database Schema
-- Optimized for high performance with proper indexing

-- Create database (run this manually if needed)
-- CREATE DATABASE granite_measurement;

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for customer search optimization
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers (created_at DESC);

-- Measurement sheets table with sequential numbering
CREATE SEQUENCE IF NOT EXISTS measurement_sheet_seq START 1;

CREATE TABLE IF NOT EXISTS measurement_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measurement_sheet_number VARCHAR(20) NOT NULL UNIQUE DEFAULT ('MS-' || LPAD(nextval('measurement_sheet_seq')::TEXT, 4, '0')),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_type VARCHAR(50) NOT NULL CHECK (customer_type IN ('Retail', 'Granite Shops', 'Builders', 'Outstation Parties', 'Exporters')),
    total_square_feet DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for measurement sheet search optimization
CREATE INDEX IF NOT EXISTS idx_measurement_sheets_customer_id ON measurement_sheets (customer_id);
CREATE INDEX IF NOT EXISTS idx_measurement_sheets_number ON measurement_sheets (measurement_sheet_number);
CREATE INDEX IF NOT EXISTS idx_measurement_sheets_created_at ON measurement_sheets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_measurement_sheets_customer_type ON measurement_sheets (customer_type);
CREATE INDEX IF NOT EXISTS idx_measurement_sheets_status ON measurement_sheets (status);

-- Slab entries table
CREATE TABLE IF NOT EXISTS slab_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measurement_sheet_id UUID NOT NULL REFERENCES measurement_sheets(id) ON DELETE CASCADE,
    serial_number INTEGER NOT NULL,
    block_number VARCHAR(50) NOT NULL,
    length DECIMAL(8,2) NOT NULL CHECK (length > 0),
    breadth DECIMAL(8,2) NOT NULL CHECK (breadth > 0),
    slab_category VARCHAR(5) NOT NULL CHECK (slab_category IN ('F', 'LD', 'D', 'S')),
    final_length DECIMAL(8,2) NOT NULL,
    final_breadth DECIMAL(8,2) NOT NULL,
    square_feet DECIMAL(10,2) NOT NULL,
    calculation_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(measurement_sheet_id, serial_number)
);

-- Create indexes for slab entries optimization
CREATE INDEX IF NOT EXISTS idx_slab_entries_sheet_id ON slab_entries (measurement_sheet_id);
CREATE INDEX IF NOT EXISTS idx_slab_entries_block_number ON slab_entries (block_number);
CREATE INDEX IF NOT EXISTS idx_slab_entries_category ON slab_entries (slab_category);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at updates
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_measurement_sheets_updated_at BEFORE UPDATE ON measurement_sheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slab_entries_updated_at BEFORE UPDATE ON slab_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update measurement sheet total when slab entries change
CREATE OR REPLACE FUNCTION update_measurement_sheet_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE measurement_sheets 
    SET total_square_feet = (
        SELECT COALESCE(SUM(square_feet), 0) 
        FROM slab_entries 
        WHERE measurement_sheet_id = COALESCE(NEW.measurement_sheet_id, OLD.measurement_sheet_id)
    )
    WHERE id = COALESCE(NEW.measurement_sheet_id, OLD.measurement_sheet_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers for automatic total calculation
CREATE TRIGGER update_sheet_total_on_insert AFTER INSERT ON slab_entries
    FOR EACH ROW EXECUTE FUNCTION update_measurement_sheet_total();

CREATE TRIGGER update_sheet_total_on_update AFTER UPDATE ON slab_entries
    FOR EACH ROW EXECUTE FUNCTION update_measurement_sheet_total();

CREATE TRIGGER update_sheet_total_on_delete AFTER DELETE ON slab_entries
    FOR EACH ROW EXECUTE FUNCTION update_measurement_sheet_total();