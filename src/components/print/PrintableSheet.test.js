import React from 'react';
import { render, screen } from '@testing-library/react';
import PrintableSheet from './PrintableSheet';

// Mock measurement sheet data for testing
const mockMeasurementSheet = {
  id: 'test-sheet-1',
  measurementSheetNumber: 'MS-0001',
  customerType: 'retail',
  createdAt: '2024-01-15T10:30:00Z',
  customer: {
    name: 'Test Customer',
    phoneNumber: '123-456-7890',
    email: 'test@example.com',
    address: '123 Test Street, Test City'
  },
  slabEntries: [
    {
      id: 'slab-1',
      serialNumber: 1,
      blockNumber: 'B001',
      length: 48,
      breadth: 24,
      slabCategory: 'F',
      finalLength: 48,
      finalBreadth: 24,
      squareFeet: 8.0,
      calculationDetails: '(48 × 24) ÷ 144 = 8.00'
    },
    {
      id: 'slab-2',
      serialNumber: 2,
      blockNumber: 'B002',
      length: 36,
      breadth: 18,
      slabCategory: 'LD',
      finalLength: 36,
      finalBreadth: 18,
      squareFeet: 4.5,
      calculationDetails: '(36 × 18) ÷ 144 = 4.50'
    }
  ]
};

describe('PrintableSheet Component', () => {
  test('renders measurement sheet header correctly', () => {
    render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
    
    expect(screen.getByText('MEASUREMENT SHEET')).toBeInTheDocument();
    expect(screen.getByText('#MS-0001')).toBeInTheDocument();
    expect(screen.getByText('Granite Manufacturing Co.')).toBeInTheDocument();
  });

  test('renders customer information correctly', () => {
    render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
    
    expect(screen.getByText('Customer Information')).toBeInTheDocument();
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  test('renders slab entries table correctly', () => {
    render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
    
    expect(screen.getByText('Slab Entries')).toBeInTheDocument();
    expect(screen.getByText('B001')).toBeInTheDocument();
    expect(screen.getByText('B002')).toBeInTheDocument();
    expect(screen.getByText('8.00')).toBeInTheDocument();
    expect(screen.getByText('4.50')).toBeInTheDocument();
  });

  test('renders individual calculations correctly', () => {
    render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
    
    expect(screen.getByText('Individual Slab Calculations')).toBeInTheDocument();
    expect(screen.getByText('Slab #1')).toBeInTheDocument();
    expect(screen.getByText('Slab #2')).toBeInTheDocument();
    expect(screen.getByText('(48 × 24) ÷ 144 = 8.00')).toBeInTheDocument();
    expect(screen.getByText('(36 × 18) ÷ 144 = 4.50')).toBeInTheDocument();
  });

  test('renders summary totals correctly', () => {
    render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
    
    expect(screen.getByText('Total Slabs:')).toBeInTheDocument();
    expect(screen.getByText('12.50 sq ft')).toBeInTheDocument();
    // Check for total slabs in the totals section specifically
    const totalSlabsSection = screen.getByText('Total Slabs:').closest('.total-item');
    expect(totalSlabsSection).toHaveTextContent('2');
  });

  test('renders footer with signatures', () => {
    render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
    
    expect(screen.getByText('Customer Signature')).toBeInTheDocument();
    expect(screen.getByText('Authorized Signature')).toBeInTheDocument();
    expect(screen.getByText(/This measurement sheet is computer generated/)).toBeInTheDocument();
  });

  test('handles missing measurement sheet data gracefully', () => {
    render(<PrintableSheet measurementSheet={null} />);
    
    expect(screen.getByText('No measurement sheet data available')).toBeInTheDocument();
  });

  test('respects includeSections configuration', () => {
    const includeSections = {
      header: true,
      customerDetails: false,
      slabEntries: true,
      calculations: false,
      totals: true,
      footer: false
    };

    render(
      <PrintableSheet 
        measurementSheet={mockMeasurementSheet} 
        includeSections={includeSections}
      />
    );
    
    // Should include header
    expect(screen.getByText('MEASUREMENT SHEET')).toBeInTheDocument();
    
    // Should not include customer details
    expect(screen.queryByText('Customer Information')).not.toBeInTheDocument();
    
    // Should include slab entries
    expect(screen.getByText('Slab Entries')).toBeInTheDocument();
    
    // Should not include calculations
    expect(screen.queryByText('Individual Slab Calculations')).not.toBeInTheDocument();
    
    // Should include totals
    expect(screen.getByText('Total Slabs:')).toBeInTheDocument();
    
    // Should not include footer
    expect(screen.queryByText('Customer Signature')).not.toBeInTheDocument();
  });

  test('handles empty slab entries', () => {
    const emptySheet = {
      ...mockMeasurementSheet,
      slabEntries: []
    };

    render(<PrintableSheet measurementSheet={emptySheet} />);
    
    expect(screen.getByText('MEASUREMENT SHEET')).toBeInTheDocument();
    expect(screen.getByText('0.00 sq ft')).toBeInTheDocument();
    expect(screen.queryByText('Slab Entries')).not.toBeInTheDocument();
  });
});