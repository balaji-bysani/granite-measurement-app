import { calculationEngine } from './calculationEngine';
import { CUSTOMER_TYPES } from './constants';

describe('Calculation Engine', () => {
  describe('Retail Customer Calculations', () => {
    test('should calculate square feet directly for retail customers', () => {
      const result = calculationEngine.calculateSquareFeet(144, 144, CUSTOMER_TYPES.RETAIL);
      
      expect(result.finalLength).toBe(144);
      expect(result.finalBreadth).toBe(144);
      expect(result.squareFeet).toBe(144); // (144 * 144) / 144 = 144
      expect(result.rawCalculation).toBe('(144 × 144) ÷ 144');
    });

    test('should handle decimal results for retail customers', () => {
      const result = calculationEngine.calculateSquareFeet(100, 50, CUSTOMER_TYPES.RETAIL);
      
      expect(result.finalLength).toBe(100);
      expect(result.finalBreadth).toBe(50);
      expect(result.squareFeet).toBe(34.72); // (100 * 50) / 144 = 34.72
    });
  });

  describe('Granite Shops Customer Calculations', () => {
    test('should apply length-3 and breadth-2 with divisibility by 3', () => {
      const result = calculationEngine.calculateSquareFeet(150, 146, CUSTOMER_TYPES.GRANITE_SHOPS);
      
      // Length: 150 - 3 = 147, 147 % 3 = 0, so finalLength = 147
      // Breadth: 146 - 2 = 144, 144 % 3 = 0, so finalBreadth = 144
      expect(result.finalLength).toBe(147);
      expect(result.finalBreadth).toBe(144);
      expect(result.squareFeet).toBe(147); // (147 * 144) / 144 = 147
    });

    test('should adjust for divisibility by 3 when needed', () => {
      const result = calculationEngine.calculateSquareFeet(149, 145, CUSTOMER_TYPES.GRANITE_SHOPS);
      
      // Length: 149 - 3 = 146, 146 % 3 = 2, so subtract 2 more = 144
      // Breadth: 145 - 2 = 143, 143 % 3 = 2, so subtract 2 more = 141
      expect(result.finalLength).toBe(144);
      expect(result.finalBreadth).toBe(141);
      expect(result.squareFeet).toBe(141); // (144 * 141) / 144 = 141
    });
  });

  describe('Builders Customer Calculations', () => {
    test('should apply length-3 with divisibility by 3, keep original breadth', () => {
      const result = calculationEngine.calculateSquareFeet(150, 100, CUSTOMER_TYPES.BUILDERS);
      
      // Length: 150 - 3 = 147, 147 % 3 = 0, so finalLength = 147
      // Breadth: 100 (no adjustment)
      expect(result.finalLength).toBe(147);
      expect(result.finalBreadth).toBe(100);
      expect(result.squareFeet).toBe(102.08); // (147 * 100) / 144 = 102.08
    });

    test('should adjust length for divisibility by 3 but keep original breadth', () => {
      const result = calculationEngine.calculateSquareFeet(149, 100, CUSTOMER_TYPES.BUILDERS);
      
      // Length: 149 - 3 = 146, 146 % 3 = 2, so subtract 2 more = 144
      // Breadth: 100 (no adjustment)
      expect(result.finalLength).toBe(144);
      expect(result.finalBreadth).toBe(100);
      expect(result.squareFeet).toBe(100); // (144 * 100) / 144 = 100
    });
  });

  describe('Exporters Customer Calculations', () => {
    test('should apply simple L-3, B-2 deductions', () => {
      const result = calculationEngine.calculateSquareFeet(150, 100, CUSTOMER_TYPES.EXPORTERS);
      
      // Length: 150 - 3 = 147
      // Breadth: 100 - 2 = 98
      expect(result.finalLength).toBe(147);
      expect(result.finalBreadth).toBe(98);
      expect(result.squareFeet).toBe(100.04); // (147 * 98) / 144 = 100.04
    });

    test('should handle minimum values for exporters', () => {
      const result = calculationEngine.calculateSquareFeet(3, 2, CUSTOMER_TYPES.EXPORTERS);
      
      // Length: 3 - 3 = 0
      // Breadth: 2 - 2 = 0
      expect(result.finalLength).toBe(0);
      expect(result.finalBreadth).toBe(0);
      expect(result.squareFeet).toBe(0);
    });
  });

  describe('Outstation Parties Customer Calculations', () => {
    test('should use same calculation as Granite Shops', () => {
      const outstationResult = calculationEngine.calculateSquareFeet(150, 146, CUSTOMER_TYPES.OUTSTATION_PARTIES);
      const graniteShopsResult = calculationEngine.calculateSquareFeet(150, 146, CUSTOMER_TYPES.GRANITE_SHOPS);
      
      expect(outstationResult.finalLength).toBe(graniteShopsResult.finalLength);
      expect(outstationResult.finalBreadth).toBe(graniteShopsResult.finalBreadth);
      expect(outstationResult.squareFeet).toBe(graniteShopsResult.squareFeet);
    });
  });

  describe('Input Validation', () => {
    test('should throw error for invalid length or breadth', () => {
      expect(() => {
        calculationEngine.calculateSquareFeet(0, 100, CUSTOMER_TYPES.RETAIL);
      }).toThrow('Validation failed');

      expect(() => {
        calculationEngine.calculateSquareFeet(100, -5, CUSTOMER_TYPES.RETAIL);
      }).toThrow('Validation failed');

      expect(() => {
        calculationEngine.calculateSquareFeet(null, 100, CUSTOMER_TYPES.RETAIL);
      }).toThrow('Validation failed');
    });

    test('should throw error for invalid customer type', () => {
      expect(() => {
        calculationEngine.calculateSquareFeet(100, 100, 'Invalid Type');
      }).toThrow('Validation failed');

      expect(() => {
        calculationEngine.calculateSquareFeet(100, 100, null);
      }).toThrow('Validation failed');
    });
  });

  describe('Individual Processing Methods', () => {
    test('processLength should work correctly for each customer type', () => {
      expect(calculationEngine.processLength(150, CUSTOMER_TYPES.RETAIL)).toBe(150);
      expect(calculationEngine.processLength(150, CUSTOMER_TYPES.GRANITE_SHOPS)).toBe(147);
      expect(calculationEngine.processLength(149, CUSTOMER_TYPES.BUILDERS)).toBe(144);
      expect(calculationEngine.processLength(150, CUSTOMER_TYPES.EXPORTERS)).toBe(147);
      expect(calculationEngine.processLength(150, CUSTOMER_TYPES.OUTSTATION_PARTIES)).toBe(147);
    });

    test('processBreadth should work correctly for each customer type', () => {
      expect(calculationEngine.processBreadth(100, CUSTOMER_TYPES.RETAIL)).toBe(100);
      expect(calculationEngine.processBreadth(146, CUSTOMER_TYPES.GRANITE_SHOPS)).toBe(144);
      expect(calculationEngine.processBreadth(100, CUSTOMER_TYPES.BUILDERS)).toBe(100);
      expect(calculationEngine.processBreadth(100, CUSTOMER_TYPES.EXPORTERS)).toBe(98);
      expect(calculationEngine.processBreadth(146, CUSTOMER_TYPES.OUTSTATION_PARTIES)).toBe(144);
    });
  });

  describe('Calculation Descriptions', () => {
    test('should return correct descriptions for each customer type', () => {
      expect(calculationEngine.getCalculationDescription(CUSTOMER_TYPES.RETAIL))
        .toBe('Direct calculation: (Length × Breadth) ÷ 144');
      
      expect(calculationEngine.getCalculationDescription(CUSTOMER_TYPES.GRANITE_SHOPS))
        .toBe('Length-3 and Breadth-2 with divisibility by 3 adjustment');
      
      expect(calculationEngine.getCalculationDescription(CUSTOMER_TYPES.BUILDERS))
        .toBe('Length-3 with divisibility by 3 adjustment, original breadth');
      
      expect(calculationEngine.getCalculationDescription(CUSTOMER_TYPES.EXPORTERS))
        .toBe('Simple deduction: (Length-3) × (Breadth-2) ÷ 144');
      
      expect(calculationEngine.getCalculationDescription(CUSTOMER_TYPES.OUTSTATION_PARTIES))
        .toBe('Same as Granite Shops: Length-3 and Breadth-2 with divisibility by 3');
    });
  });
});