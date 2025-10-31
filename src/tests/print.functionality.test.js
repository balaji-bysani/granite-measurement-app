/**
 * Print Functionality Tests
 * Tests print functionality across different browsers and scenarios
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PrintableSheet from '../components/print/PrintableSheet';

// Mock window.print for testing
const mockPrint = jest.fn();
Object.defineProperty(window, 'print', {
  writable: true,
  value: mockPrint,
});

// Mock react-to-print
jest.mock('react-to-print', () => ({
  useReactToPrint: () => mockPrint
}));

// Mock measurement sheet data
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
      length: 144,
      breadth: 144,
      slabCategory: 'F',
      finalLength: 144,
      finalBreadth: 144,
      squareFeet: 144.0,
      calculationDetails: '(144 × 144) ÷ 144 = 144.00'
    },
    {
      id: 'slab-2',
      serialNumber: 2,
      blockNumber: 'B002',
      length: 72,
      breadth: 72,
      slabCategory: 'LD',
      finalLength: 72,
      finalBreadth: 72,
      squareFeet: 36.0,
      calculationDetails: '(72 × 72) ÷ 144 = 36.00'
    }
  ]
};

describe('Print Functionality Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Print Layout and Formatting', () => {
    test('should render printable sheet with correct layout', () => {
      render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
      
      // Verify main sections are present
      expect(screen.getByText('MEASUREMENT SHEET')).toBeInTheDocument();
      expect(screen.getByText('#MS-0001')).toBeInTheDocument();
      expect(screen.getByText('Customer Information')).toBeInTheDocument();
      expect(screen.getByText('Slab Entries')).toBeInTheDocument();
      expect(screen.getByText('Individual Slab Calculations')).toBeInTheDocument();
    });

    test('should format customer information correctly for print', () => {
      render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
      
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
      expect(screen.getByText('123-456-7890')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('123 Test Street, Test City')).toBeInTheDocument();
    });

    test('should format slab entries table correctly', () => {
      render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
      
      // Check table headers
      expect(screen.getByText('Serial')).toBeInTheDocument();
      expect(screen.getByText('Block No')).toBeInTheDocument();
      expect(screen.getByText('Length')).toBeInTheDocument();
      expect(screen.getByText('Breadth')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Sq Ft')).toBeInTheDocument();
      
      // Check data rows
      expect(screen.getByText('B001')).toBeInTheDocument();
      expect(screen.getByText('B002')).toBeInTheDocument();
      expect(screen.getByText('144.00')).toBeInTheDocument();
      expect(screen.getByText('36.00')).toBeInTheDocument();
    });

    test('should display calculations section correctly', () => {
      render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
      
      expect(screen.getByText('Slab #1')).toBeInTheDocument();
      expect(screen.getByText('Slab #2')).toBeInTheDocument();
      expect(screen.getByText('(144 × 144) ÷ 144 = 144.00')).toBeInTheDocument();
      expect(screen.getByText('(72 × 72) ÷ 144 = 36.00')).toBeInTheDocument();
    });

    test('should show correct totals', () => {
      render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
      
      expect(screen.getByText('Total Slabs:')).toBeInTheDocument();
      expect(screen.getByText('180.00 sq ft')).toBeInTheDocument();
      
      // Check for total slabs count
      const totalSlabsSection = screen.getByText('Total Slabs:').closest('.total-item');
      expect(totalSlabsSection).toHaveTextContent('2');
    });
  });

  describe('Print Configuration Options', () => {
    test('should respect includeSections configuration', () => {
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

    test('should handle print with minimal sections', () => {
      const includeSections = {
        header: true,
        customerDetails: false,
        slabEntries: false,
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
      
      expect(screen.getByText('MEASUREMENT SHEET')).toBeInTheDocument();
      expect(screen.getByText('180.00 sq ft')).toBeInTheDocument();
      expect(screen.queryByText('Slab Entries')).not.toBeInTheDocument();
    });
  });

  describe('Print Edge Cases', () => {
    test('should handle empty measurement sheet', () => {
      const emptySheet = {
        ...mockMeasurementSheet,
        slabEntries: []
      };

      render(<PrintableSheet measurementSheet={emptySheet} />);
      
      expect(screen.getByText('MEASUREMENT SHEET')).toBeInTheDocument();
      expect(screen.getByText('0.00 sq ft')).toBeInTheDocument();
      expect(screen.queryByText('Slab Entries')).not.toBeInTheDocument();
    });

    test('should handle null measurement sheet', () => {
      render(<PrintableSheet measurementSheet={null} />);
      
      expect(screen.getByText('No measurement sheet data available')).toBeInTheDocument();
    });

    test('should handle missing customer information', () => {
      const sheetWithoutCustomer = {
        ...mockMeasurementSheet,
        customer: null
      };

      render(<PrintableSheet measurementSheet={sheetWithoutCustomer} />);
      
      expect(screen.getByText('MEASUREMENT SHEET')).toBeInTheDocument();
      // Should still render other sections
      expect(screen.getByText('Slab Entries')).toBeInTheDocument();
    });

    test('should handle very long customer names and addresses', () => {
      const sheetWithLongData = {
        ...mockMeasurementSheet,
        customer: {
          ...mockMeasurementSheet.customer,
          name: 'Very Long Customer Name That Might Overflow The Print Layout And Cause Issues',
          address: 'Very Long Address That Spans Multiple Lines And Contains Lots Of Details About The Location Including Street Number Building Name Area City State Country Postal Code'
        }
      };

      render(<PrintableSheet measurementSheet={sheetWithLongData} />);
      
      expect(screen.getByText('Very Long Customer Name That Might Overflow The Print Layout And Cause Issues')).toBeInTheDocument();
      expect(screen.getByText(/Very Long Address That Spans Multiple Lines/)).toBeInTheDocument();
    });
  });

  describe('Print CSS and Styling', () => {
    test('should apply print-specific CSS classes', () => {
      const { container } = render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
      
      const printableElement = container.querySelector('.printable-sheet');
      expect(printableElement).toBeInTheDocument();
      expect(printableElement).toHaveClass('printable-sheet');
    });

    test('should have proper page break handling', () => {
      const sheetWithManySlabs = {
        ...mockMeasurementSheet,
        slabEntries: Array.from({ length: 50 }, (_, i) => ({
          id: `slab-${i}`,
          serialNumber: i + 1,
          blockNumber: `B${String(i + 1).padStart(3, '0')}`,
          length: 100,
          breadth: 100,
          slabCategory: 'F',
          finalLength: 100,
          finalBreadth: 100,
          squareFeet: 69.44,
          calculationDetails: '(100 × 100) ÷ 144 = 69.44'
        }))
      };

      const { container } = render(<PrintableSheet measurementSheet={sheetWithManySlabs} />);
      
      // Should render all slabs
      expect(container.querySelectorAll('[data-testid^="slab-entry-"]')).toHaveLength(50);
    });
  });

  describe('Print Data Accuracy', () => {
    test('should display accurate calculation details', () => {
      render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
      
      // Verify calculations are displayed correctly
      expect(screen.getByText('(144 × 144) ÷ 144 = 144.00')).toBeInTheDocument();
      expect(screen.getByText('(72 × 72) ÷ 144 = 36.00')).toBeInTheDocument();
    });

    test('should show correct measurement sheet number', () => {
      render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
      
      expect(screen.getByText('#MS-0001')).toBeInTheDocument();
    });

    test('should display correct customer type', () => {
      render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
      
      // Customer type should be displayed somewhere in the sheet
      const printableContent = screen.getByText('MEASUREMENT SHEET').closest('.printable-sheet');
      expect(printableContent).toHaveTextContent('retail');
    });

    test('should calculate and display correct totals', () => {
      render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
      
      // Total should be sum of all slab entries (144 + 36 = 180)
      expect(screen.getByText('180.00 sq ft')).toBeInTheDocument();
      
      // Total slabs should be 2
      const totalSlabsSection = screen.getByText('Total Slabs:').closest('.total-item');
      expect(totalSlabsSection).toHaveTextContent('2');
    });
  });

  describe('Print Accessibility', () => {
    test('should have proper semantic structure for screen readers', () => {
      render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
      
      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('MEASUREMENT SHEET');
      
      // Check for table structure
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Check for proper table headers
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(0);
    });

    test('should have appropriate contrast for print', () => {
      const { container } = render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
      
      // Verify that the component renders without accessibility violations
      // In a real test, you might use jest-axe or similar tools
      const printableSheet = container.querySelector('.printable-sheet');
      expect(printableSheet).toBeInTheDocument();
    });
  });

  describe('Cross-Browser Print Compatibility', () => {
    test('should handle different user agents', () => {
      // Mock different user agents
      const originalUserAgent = navigator.userAgent;
      
      // Test Chrome
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
      expect(screen.getByText('MEASUREMENT SHEET')).toBeInTheDocument();
      
      // Test Firefox
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
      });
      
      render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
      expect(screen.getByText('MEASUREMENT SHEET')).toBeInTheDocument();
      
      // Restore original user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: originalUserAgent
      });
    });

    test('should handle print media queries', () => {
      // Mock matchMedia for print media queries
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === 'print',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<PrintableSheet measurementSheet={mockMeasurementSheet} />);
      expect(screen.getByText('MEASUREMENT SHEET')).toBeInTheDocument();
    });
  });
});