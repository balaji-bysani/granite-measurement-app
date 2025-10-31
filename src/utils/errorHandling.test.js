/**
 * Test file for error handling functionality
 * Tests validation helpers, error handlers, and calculation engine error handling
 */

import { 
  validatePositiveNumber, 
  validateRequiredString, 
  validateSlabEntry, 
  validateCustomer 
} from './validationHelpers';
import { calculationEngine } from './calculationEngine';
import { CUSTOMER_TYPES } from './constants';

describe('Validation Helpers', () => {
  describe('validatePositiveNumber', () => {
    test('should pass for valid positive numbers', () => {
      expect(validatePositiveNumber(10, 'Length')).toEqual([]);
      expect(validatePositiveNumber(0.5, 'Breadth')).toEqual([]);
      expect(validatePositiveNumber(9999, 'Value')).toEqual([]);
    });

    test('should fail for invalid inputs', () => {
      expect(validatePositiveNumber(0, 'Length')).toContain('Length must be greater than 0');
      expect(validatePositiveNumber(-5, 'Length')).toContain('Length must be greater than 0');
      expect(validatePositiveNumber('abc', 'Length')).toContain('Length must be a valid number');
      expect(validatePositiveNumber(null, 'Length')).toContain('Length is required');
      expect(validatePositiveNumber(10001, 'Length')).toContain('Length must be less than 10,000');
    });
  });

  describe('validateRequiredString', () => {
    test('should pass for valid strings', () => {
      expect(validateRequiredString('Valid Name', 'Name')).toEqual([]);
      expect(validateRequiredString('AB', 'Name', 2, 10)).toEqual([]);
    });

    test('should fail for invalid inputs', () => {
      expect(validateRequiredString('', 'Name')).toContain('Name is required');
      expect(validateRequiredString('A', 'Name', 2)).toContain('Name must be at least 2 characters');
      expect(validateRequiredString('Very long name that exceeds limit', 'Name', 1, 10))
        .toContain('Name must be less than 10 characters');
    });
  });

  describe('validateSlabEntry', () => {
    test('should pass for valid slab entry', () => {
      const validEntry = {
        blockNumber: 'B001',
        length: 48,
        breadth: 24,
        slabCategory: 'F'
      };
      const result = validateSlabEntry(validEntry);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('should fail for invalid slab entry', () => {
      const invalidEntry = {
        blockNumber: '',
        length: -5,
        breadth: 'invalid',
        slabCategory: 'INVALID'
      };
      const result = validateSlabEntry(invalidEntry);
      expect(result.isValid).toBe(false);
      expect(result.errors.blockNumber).toBeDefined();
      expect(result.errors.length).toBeDefined();
      expect(result.errors.breadth).toBeDefined();
      expect(result.errors.slabCategory).toBeDefined();
    });
  });
});

describe('Calculation Engine Error Handling', () => {
  test('should handle valid calculations', () => {
    const result = calculationEngine.calculateSquareFeet(48, 24, CUSTOMER_TYPES.RETAIL);
    expect(result.squareFeet).toBeGreaterThan(0);
    expect(result.finalLength).toBe(48);
    expect(result.finalBreadth).toBe(24);
  });

  test('should throw validation errors for invalid inputs', () => {
    expect(() => {
      calculationEngine.calculateSquareFeet(null, 24, CUSTOMER_TYPES.RETAIL);
    }).toThrow();

    expect(() => {
      calculationEngine.calculateSquareFeet(48, -5, CUSTOMER_TYPES.RETAIL);
    }).toThrow();

    expect(() => {
      calculationEngine.calculateSquareFeet(48, 24, 'INVALID_TYPE');
    }).toThrow();
  });

  test('should handle edge cases gracefully', () => {
    // Very small dimensions that might result in zero after processing
    const result = calculationEngine.calculateSquareFeet(2, 1, CUSTOMER_TYPES.GRANITE_SHOPS);
    expect(result.squareFeet).toBeGreaterThanOrEqual(0);
  });

  test('should provide detailed error information', () => {
    try {
      calculationEngine.calculateSquareFeet('invalid', 24, CUSTOMER_TYPES.RETAIL);
    } catch (error) {
      expect(error.type).toBe('validation');
      expect(error.details).toBeDefined();
      expect(Array.isArray(error.details)).toBe(true);
    }
  });
});

describe('Error Edge Cases', () => {
  test('should handle extremely large numbers', () => {
    expect(() => {
      calculationEngine.calculateSquareFeet(99999, 24, CUSTOMER_TYPES.RETAIL);
    }).toThrow();
  });

  test('should handle zero and negative dimensions', () => {
    expect(() => {
      calculationEngine.calculateSquareFeet(0, 24, CUSTOMER_TYPES.RETAIL);
    }).toThrow();

    expect(() => {
      calculationEngine.calculateSquareFeet(48, -10, CUSTOMER_TYPES.RETAIL);
    }).toThrow();
  });

  test('should handle string inputs that could be numbers', () => {
    const result = calculationEngine.calculateSquareFeet('48', '24', CUSTOMER_TYPES.RETAIL);
    expect(result.squareFeet).toBeGreaterThan(0);
  });

  test('should handle whitespace and empty strings', () => {
    expect(() => {
      calculationEngine.calculateSquareFeet('  ', '24', CUSTOMER_TYPES.RETAIL);
    }).toThrow();

    expect(() => {
      calculationEngine.calculateSquareFeet('48', '', CUSTOMER_TYPES.RETAIL);
    }).toThrow();
  });
});