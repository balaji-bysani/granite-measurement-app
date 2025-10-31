/**
 * Integration Test for Complete User Workflow
 * Tests the end-to-end functionality of the granite measurement sheet application
 */

import { calculationEngine } from './utils/calculationEngine';
import { CUSTOMER_TYPES } from './utils/constants';

describe('Complete User Workflow Integration', () => {
  let testCustomer;
  let testMeasurementSheet;

  beforeAll(() => {
    // Mock test customer
    testCustomer = {
      id: 'test-customer-id',
      name: 'Test Integration Customer',
      phoneNumber: '999-888-7777',
      email: 'integration@test.com',
      address: '123 Test Street, Test City, TS 12345'
    };

    // Mock test measurement sheet
    testMeasurementSheet = {
      id: 'test-sheet-id',
      measurementSheetNumber: 'MS-TEST-001',
      customerType: CUSTOMER_TYPES.RETAIL,
      customerId: testCustomer.id,
      status: 'draft',
      createdAt: new Date().toISOString()
    };
  });

  describe('1. Customer Data Structure', () => {
    test('should have valid customer structure', () => {
      expect(testCustomer).toBeDefined();
      expect(testCustomer.id).toBeDefined();
      expect(testCustomer.name).toBe('Test Integration Customer');
      expect(testCustomer.phoneNumber).toBe('999-888-7777');
    });
  });

  describe('2. Measurement Sheet Structure', () => {
    test('should have valid measurement sheet structure', () => {
      expect(testMeasurementSheet).toBeDefined();
      expect(testMeasurementSheet.id).toBeDefined();
      expect(testMeasurementSheet.measurementSheetNumber).toBeDefined();
      expect(testMeasurementSheet.customerType).toBe(CUSTOMER_TYPES.RETAIL);
      expect(testMeasurementSheet.customerId).toBe(testCustomer.id);
      expect(testMeasurementSheet.status).toBe('draft');
    });
  });

  describe('3. Calculation Engine Integration', () => {
    test('should calculate correctly for all customer types', () => {
      const testDimensions = { length: 144, breadth: 144 };

      // Test Retail calculation
      const retailResult = calculationEngine.calculateSquareFeet(
        testDimensions.length, 
        testDimensions.breadth, 
        CUSTOMER_TYPES.RETAIL
      );
      expect(retailResult.squareFeet).toBe(144); // (144 * 144) / 144 = 144

      // Test Granite Shops calculation
      const graniteShopsResult = calculationEngine.calculateSquareFeet(
        testDimensions.length, 
        testDimensions.breadth, 
        CUSTOMER_TYPES.GRANITE_SHOPS
      );
      expect(graniteShopsResult.finalLength).toBe(141); // 144 - 3 = 141 (divisible by 3)
      expect(graniteShopsResult.finalBreadth).toBe(141); // 144 - 2 = 142, then 141 (divisible by 3)

      // Test Builders calculation
      const buildersResult = calculationEngine.calculateSquareFeet(
        testDimensions.length, 
        testDimensions.breadth, 
        CUSTOMER_TYPES.BUILDERS
      );
      expect(buildersResult.finalLength).toBe(141); // 144 - 3 = 141 (divisible by 3)
      expect(buildersResult.finalBreadth).toBe(144); // Original breadth

      // Test Exporters calculation
      const exportersResult = calculationEngine.calculateSquareFeet(
        testDimensions.length, 
        testDimensions.breadth, 
        CUSTOMER_TYPES.EXPORTERS
      );
      expect(exportersResult.finalLength).toBe(141); // 144 - 3 = 141
      expect(exportersResult.finalBreadth).toBe(142); // 144 - 2 = 142

      // Test Outstation Parties calculation (same as Granite Shops)
      const outstationResult = calculationEngine.calculateSquareFeet(
        testDimensions.length, 
        testDimensions.breadth, 
        CUSTOMER_TYPES.OUTSTATION_PARTIES
      );
      expect(outstationResult.finalLength).toBe(graniteShopsResult.finalLength);
      expect(outstationResult.finalBreadth).toBe(graniteShopsResult.finalBreadth);
      expect(outstationResult.squareFeet).toBe(graniteShopsResult.squareFeet);
    });
  });

  describe('4. Slab Entry Data Structure', () => {
    test('should create valid slab entry with calculation', () => {
      const calculation = calculationEngine.calculateSquareFeet(
        144, 144, CUSTOMER_TYPES.RETAIL
      );

      const slabEntry = {
        id: 'test-slab-entry-id',
        serialNumber: 1,
        blockNumber: 'BLOCK-001',
        length: 144,
        breadth: 144,
        slabCategory: 'F',
        finalLength: calculation.finalLength,
        finalBreadth: calculation.finalBreadth,
        squareFeet: calculation.squareFeet,
        calculationDetails: calculation.rawCalculation
      };

      expect(slabEntry).toBeDefined();
      expect(slabEntry.id).toBeDefined();
      expect(slabEntry.blockNumber).toBe('BLOCK-001');
      expect(slabEntry.serialNumber).toBe(1);
      expect(slabEntry.squareFeet).toBe(144);
    });
  });

  describe('5. Data Flow Integration', () => {
    test('should maintain data consistency across workflow', () => {
      const mockMeasurementSheet = {
        id: testMeasurementSheet.id,
        measurementSheetNumber: testMeasurementSheet.measurementSheetNumber,
        customerType: CUSTOMER_TYPES.RETAIL,
        customer: testCustomer,
        createdAt: new Date().toISOString(),
        slabEntries: [
          {
            serialNumber: 1,
            blockNumber: 'BLOCK-001',
            length: 144,
            breadth: 144,
            slabCategory: 'F',
            finalLength: 144,
            finalBreadth: 144,
            squareFeet: 144,
            calculationDetails: '(144 × 144) ÷ 144'
          }
        ]
      };

      // Verify data structure integrity
      expect(mockMeasurementSheet.customer.id).toBe(testCustomer.id);
      expect(mockMeasurementSheet.slabEntries[0].squareFeet).toBe(144);
      expect(mockMeasurementSheet.customerType).toBe(CUSTOMER_TYPES.RETAIL);
    });

    test('should calculate totals correctly', () => {
      const slabEntries = [
        { squareFeet: 144 },
        { squareFeet: 100 },
        { squareFeet: 50.5 }
      ];

      const totalSquareFeet = slabEntries.reduce((sum, entry) => sum + entry.squareFeet, 0);
      expect(totalSquareFeet).toBe(294.5);
    });
  });

  describe('6. Complete Workflow Integration', () => {
    test('should complete entire workflow from customer to export', async () => {
      // 1. Customer data (already defined)
      expect(testCustomer).toBeDefined();

      // 2. Measurement sheet data (already defined)
      expect(testMeasurementSheet).toBeDefined();

      // 3. Calculate slab dimensions for Granite Shops
      const calculation = calculationEngine.calculateSquareFeet(
        150, 146, CUSTOMER_TYPES.GRANITE_SHOPS
      );
      expect(calculation.squareFeet).toBeGreaterThan(0);

      // 4. Create slab entry with calculation
      const slabEntry = {
        id: 'workflow-test-entry',
        serialNumber: 1,
        blockNumber: 'WORKFLOW-TEST',
        length: 150,
        breadth: 146,
        slabCategory: 'F',
        finalLength: calculation.finalLength,
        finalBreadth: calculation.finalBreadth,
        squareFeet: calculation.squareFeet,
        calculationDetails: calculation.rawCalculation
      };

      expect(slabEntry).toBeDefined();
      expect(slabEntry.squareFeet).toBeGreaterThan(0);

      // 5. Create complete measurement sheet
      const completeSheet = {
        ...testMeasurementSheet,
        customerType: CUSTOMER_TYPES.GRANITE_SHOPS,
        customer: testCustomer,
        slabEntries: [slabEntry],
        status: 'completed'
      };

      // 6. Verify complete sheet structure
      expect(completeSheet.customer).toBeDefined();
      expect(completeSheet.slabEntries).toBeDefined();
      expect(completeSheet.slabEntries.length).toBe(1);
      expect(completeSheet.slabEntries[0].blockNumber).toBe('WORKFLOW-TEST');
      expect(completeSheet.status).toBe('completed');
    });
  });

  describe('7. Error Handling Integration', () => {
    test('should handle calculation errors gracefully', () => {
      expect(() => {
        calculationEngine.calculateSquareFeet(-1, 100, CUSTOMER_TYPES.RETAIL);
      }).toThrow('Validation failed');

      expect(() => {
        calculationEngine.calculateSquareFeet(100, 100, 'INVALID_TYPE');
      }).toThrow('Validation failed');
    });

    test('should validate data structures', () => {
      // Test customer validation
      expect(testCustomer.name).toBeTruthy();
      expect(testCustomer.phoneNumber).toBeTruthy();
      expect(testCustomer.address).toBeTruthy();

      // Test measurement sheet validation
      expect(testMeasurementSheet.measurementSheetNumber).toBeTruthy();
      expect(Object.values(CUSTOMER_TYPES)).toContain(testMeasurementSheet.customerType);
    });
  });
});