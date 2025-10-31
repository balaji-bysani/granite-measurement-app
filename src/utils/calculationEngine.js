import { CUSTOMER_TYPES } from './constants';

/**
 * Base calculation interface and structure for granite slab measurements
 * Handles different customer types with specific calculation rules
 */

/**
 * Process length with divisibility by 3 logic for wholesale customers
 * @param {number} length - Original length in inches
 * @returns {number} - Processed length divisible by 3
 */
const processLengthForDivisibility = (length) => {
  try {
    if (length < 3) {
      console.warn(`Length ${length} is less than 3 inches, result will be 0`);
      return 0;
    }
    
    let processedLength = length - 3;
    let iterations = 0;
    const maxIterations = 100; // Prevent infinite loops
    
    // Keep subtracting 1 until divisible by 3
    while (processedLength % 3 !== 0 && processedLength > 0 && iterations < maxIterations) {
      processedLength -= 1;
      iterations++;
    }
    
    if (iterations >= maxIterations) {
      console.error(`Divisibility calculation exceeded maximum iterations for length: ${length}`);
      return 0;
    }
    
    return Math.max(processedLength, 0);
  } catch (error) {
    console.error('Error processing length for divisibility:', error);
    return 0;
  }
};

/**
 * Process breadth with divisibility by 3 logic for wholesale customers
 * @param {number} breadth - Original breadth in inches
 * @returns {number} - Processed breadth divisible by 3
 */
const processBreadthForDivisibility = (breadth) => {
  try {
    if (breadth < 2) {
      console.warn(`Breadth ${breadth} is less than 2 inches, result will be 0`);
      return 0;
    }
    
    let processedBreadth = breadth - 2;
    let iterations = 0;
    const maxIterations = 100; // Prevent infinite loops
    
    // Keep subtracting 1 until divisible by 3
    while (processedBreadth % 3 !== 0 && processedBreadth > 0 && iterations < maxIterations) {
      processedBreadth -= 1;
      iterations++;
    }
    
    if (iterations >= maxIterations) {
      console.error(`Divisibility calculation exceeded maximum iterations for breadth: ${breadth}`);
      return 0;
    }
    
    return Math.max(processedBreadth, 0);
  } catch (error) {
    console.error('Error processing breadth for divisibility:', error);
    return 0;
  }
};

/**
 * Retail customer calculation method - direct L×B÷144
 * @param {number} length - Length in inches
 * @param {number} breadth - Breadth in inches
 * @returns {Object} - Calculation result with details
 */
const calculateRetail = (length, breadth) => {
  try {
    const finalLength = length;
    const finalBreadth = breadth;
    const squareInches = finalLength * finalBreadth;
    const squareFeet = squareInches / 144;
    
    // Validate calculation result
    if (!isFinite(squareFeet) || squareFeet < 0) {
      throw new Error('Invalid calculation result');
    }
    
    return {
      finalLength,
      finalBreadth,
      squareFeet: Math.round(squareFeet * 100) / 100, // Round to 2 decimal places
      calculationSteps: [
        `Length: ${length} inches (no adjustment)`,
        `Breadth: ${breadth} inches (no adjustment)`,
        `Square Inches: ${finalLength} × ${finalBreadth} = ${squareInches}`,
        `Square Feet: ${squareInches} ÷ 144 = ${squareFeet.toFixed(2)}`
      ],
      rawCalculation: `(${length} × ${breadth}) ÷ 144`
    };
  } catch (error) {
    console.error('Error in retail calculation:', error);
    throw new Error(`Retail calculation failed: ${error.message}`);
  }
};

/**
 * Granite Shops calculation with length-3, breadth-2, divisibility by 3 logic
 * @param {number} length - Length in inches
 * @param {number} breadth - Breadth in inches
 * @returns {Object} - Calculation result with details
 */
const calculateGraniteShops = (length, breadth) => {
  try {
    const finalLength = processLengthForDivisibility(length);
    const finalBreadth = processBreadthForDivisibility(breadth);
    
    // Check for edge cases
    if (finalLength === 0 || finalBreadth === 0) {
      console.warn('Granite Shops calculation resulted in zero dimensions', { 
        originalLength: length, 
        originalBreadth: breadth, 
        finalLength, 
        finalBreadth 
      });
    }
    
    const squareInches = finalLength * finalBreadth;
    const squareFeet = squareInches / 144;
    
    // Validate calculation result
    if (!isFinite(squareFeet) || squareFeet < 0) {
      throw new Error('Invalid calculation result');
    }
    
    return {
      finalLength,
      finalBreadth,
      squareFeet: Math.round(squareFeet * 100) / 100,
      calculationSteps: [
        `Length: ${length} - 3 = ${length - 3}, adjusted for divisibility by 3 = ${finalLength}`,
        `Breadth: ${breadth} - 2 = ${breadth - 2}, adjusted for divisibility by 3 = ${finalBreadth}`,
        `Square Inches: ${finalLength} × ${finalBreadth} = ${squareInches}`,
        `Square Feet: ${squareInches} ÷ 144 = ${squareFeet.toFixed(2)}`
      ],
      rawCalculation: `((${length} - 3) × (${breadth} - 2)) ÷ 144 (adjusted for divisibility by 3)`
    };
  } catch (error) {
    console.error('Error in granite shops calculation:', error);
    throw new Error(`Granite Shops calculation failed: ${error.message}`);
  }
};

/**
 * Builders calculation with length-3 adjustment only
 * @param {number} length - Length in inches
 * @param {number} breadth - Breadth in inches
 * @returns {Object} - Calculation result with details
 */
const calculateBuilders = (length, breadth) => {
  try {
    const finalLength = processLengthForDivisibility(length);
    const finalBreadth = breadth; // Use original breadth without adjustment
    
    // Check for edge cases
    if (finalLength === 0) {
      console.warn('Builders calculation resulted in zero length', { 
        originalLength: length, 
        finalLength 
      });
    }
    
    const squareInches = finalLength * finalBreadth;
    const squareFeet = squareInches / 144;
    
    // Validate calculation result
    if (!isFinite(squareFeet) || squareFeet < 0) {
      throw new Error('Invalid calculation result');
    }
    
    return {
      finalLength,
      finalBreadth,
      squareFeet: Math.round(squareFeet * 100) / 100,
      calculationSteps: [
        `Length: ${length} - 3 = ${length - 3}, adjusted for divisibility by 3 = ${finalLength}`,
        `Breadth: ${breadth} inches (no adjustment)`,
        `Square Inches: ${finalLength} × ${finalBreadth} = ${squareInches}`,
        `Square Feet: ${squareInches} ÷ 144 = ${squareFeet.toFixed(2)}`
      ],
      rawCalculation: `((${length} - 3) × ${breadth}) ÷ 144 (length adjusted for divisibility by 3)`
    };
  } catch (error) {
    console.error('Error in builders calculation:', error);
    throw new Error(`Builders calculation failed: ${error.message}`);
  }
};

/**
 * Exporters calculation with simple L-3, B-2 deductions
 * @param {number} length - Length in inches
 * @param {number} breadth - Breadth in inches
 * @returns {Object} - Calculation result with details
 */
const calculateExporters = (length, breadth) => {
  try {
    const finalLength = Math.max(length - 3, 0);
    const finalBreadth = Math.max(breadth - 2, 0);
    
    // Check for edge cases
    if (finalLength === 0 || finalBreadth === 0) {
      console.warn('Exporters calculation resulted in zero dimensions', { 
        originalLength: length, 
        originalBreadth: breadth, 
        finalLength, 
        finalBreadth 
      });
    }
    
    const squareInches = finalLength * finalBreadth;
    const squareFeet = squareInches / 144;
    
    // Validate calculation result
    if (!isFinite(squareFeet) || squareFeet < 0) {
      throw new Error('Invalid calculation result');
    }
    
    return {
      finalLength,
      finalBreadth,
      squareFeet: Math.round(squareFeet * 100) / 100,
      calculationSteps: [
        `Length: ${length} - 3 = ${finalLength}`,
        `Breadth: ${breadth} - 2 = ${finalBreadth}`,
        `Square Inches: ${finalLength} × ${finalBreadth} = ${squareInches}`,
        `Square Feet: ${squareInches} ÷ 144 = ${squareFeet.toFixed(2)}`
      ],
      rawCalculation: `((${length} - 3) × (${breadth} - 2)) ÷ 144`
    };
  } catch (error) {
    console.error('Error in exporters calculation:', error);
    throw new Error(`Exporters calculation failed: ${error.message}`);
  }
};

/**
 * Outstation Parties calculation (same as Granite Shops)
 * @param {number} length - Length in inches
 * @param {number} breadth - Breadth in inches
 * @returns {Object} - Calculation result with details
 */
const calculateOutstationParties = (length, breadth) => {
  return calculateGraniteShops(length, breadth);
};

/**
 * Main calculation engine that routes to appropriate calculation method
 */
export const calculationEngine = {
  /**
   * Calculate square feet based on customer type
   * @param {number} length - Length in inches
   * @param {number} breadth - Breadth in inches
   * @param {string} customerType - Customer type from CUSTOMER_TYPES
   * @returns {Object} - Calculation result with details
   */
  calculateSquareFeet: (length, breadth, customerType) => {
    try {
      // Comprehensive input validation
      const validationErrors = [];
      
      // Validate length
      if (length === null || length === undefined || length === '') {
        validationErrors.push('Length is required');
      } else {
        const numLength = parseFloat(length);
        if (isNaN(numLength)) {
          validationErrors.push('Length must be a valid number');
        } else if (numLength <= 0) {
          validationErrors.push('Length must be greater than 0');
        } else if (numLength > 10000) {
          validationErrors.push('Length cannot exceed 10,000 inches');
        }
      }
      
      // Validate breadth
      if (breadth === null || breadth === undefined || breadth === '') {
        validationErrors.push('Breadth is required');
      } else {
        const numBreadth = parseFloat(breadth);
        if (isNaN(numBreadth)) {
          validationErrors.push('Breadth must be a valid number');
        } else if (numBreadth <= 0) {
          validationErrors.push('Breadth must be greater than 0');
        } else if (numBreadth > 10000) {
          validationErrors.push('Breadth cannot exceed 10,000 inches');
        }
      }
      
      // Validate customer type
      if (!customerType) {
        validationErrors.push('Customer type is required');
      } else if (!Object.values(CUSTOMER_TYPES).includes(customerType)) {
        validationErrors.push(`Invalid customer type: ${customerType}. Valid types are: ${Object.values(CUSTOMER_TYPES).join(', ')}`);
      }
      
      if (validationErrors.length > 0) {
        const error = new Error('Validation failed');
        error.type = 'validation';
        error.details = validationErrors;
        throw error;
      }
      
      // Convert to numbers for calculation
      const numLength = parseFloat(length);
      const numBreadth = parseFloat(breadth);
      
      // Route to appropriate calculation method
      switch (customerType) {
        case CUSTOMER_TYPES.RETAIL:
          return calculateRetail(numLength, numBreadth);
        
        case CUSTOMER_TYPES.GRANITE_SHOPS:
          return calculateGraniteShops(numLength, numBreadth);
        
        case CUSTOMER_TYPES.BUILDERS:
          return calculateBuilders(numLength, numBreadth);
        
        case CUSTOMER_TYPES.EXPORTERS:
          return calculateExporters(numLength, numBreadth);
        
        case CUSTOMER_TYPES.OUTSTATION_PARTIES:
          return calculateOutstationParties(numLength, numBreadth);
        
        default:
          const error = new Error(`Unsupported customer type: ${customerType}`);
          error.type = 'unsupported_customer_type';
          throw error;
      }
    } catch (error) {
      // Log calculation errors for debugging
      console.error('Calculation error:', {
        length,
        breadth,
        customerType,
        error: error.message,
        details: error.details
      });
      
      // Re-throw with additional context if not already a validation error
      if (error.type !== 'validation') {
        const calculationError = new Error(`Calculation failed: ${error.message}`);
        calculationError.type = 'calculation';
        calculationError.originalError = error;
        throw calculationError;
      }
      
      throw error;
    }
  },

  /**
   * Process length based on customer type
   * @param {number} length - Original length in inches
   * @param {string} customerType - Customer type from CUSTOMER_TYPES
   * @returns {number} - Processed length
   */
  processLength: (length, customerType) => {
    switch (customerType) {
      case CUSTOMER_TYPES.RETAIL:
        return length;
      
      case CUSTOMER_TYPES.GRANITE_SHOPS:
      case CUSTOMER_TYPES.BUILDERS:
      case CUSTOMER_TYPES.OUTSTATION_PARTIES:
        return processLengthForDivisibility(length);
      
      case CUSTOMER_TYPES.EXPORTERS:
        return Math.max(length - 3, 0);
      
      default:
        return length;
    }
  },

  /**
   * Process breadth based on customer type
   * @param {number} breadth - Original breadth in inches
   * @param {string} customerType - Customer type from CUSTOMER_TYPES
   * @returns {number} - Processed breadth
   */
  processBreadth: (breadth, customerType) => {
    switch (customerType) {
      case CUSTOMER_TYPES.RETAIL:
      case CUSTOMER_TYPES.BUILDERS:
        return breadth;
      
      case CUSTOMER_TYPES.GRANITE_SHOPS:
      case CUSTOMER_TYPES.OUTSTATION_PARTIES:
        return processBreadthForDivisibility(breadth);
      
      case CUSTOMER_TYPES.EXPORTERS:
        return Math.max(breadth - 2, 0);
      
      default:
        return breadth;
    }
  },

  /**
   * Get calculation method description for a customer type
   * @param {string} customerType - Customer type from CUSTOMER_TYPES
   * @returns {string} - Description of calculation method
   */
  getCalculationDescription: (customerType) => {
    switch (customerType) {
      case CUSTOMER_TYPES.RETAIL:
        return 'Direct calculation: (Length × Breadth) ÷ 144';
      
      case CUSTOMER_TYPES.GRANITE_SHOPS:
        return 'Length-3 and Breadth-2 with divisibility by 3 adjustment';
      
      case CUSTOMER_TYPES.BUILDERS:
        return 'Length-3 with divisibility by 3 adjustment, original breadth';
      
      case CUSTOMER_TYPES.EXPORTERS:
        return 'Simple deduction: (Length-3) × (Breadth-2) ÷ 144';
      
      case CUSTOMER_TYPES.OUTSTATION_PARTIES:
        return 'Same as Granite Shops: Length-3 and Breadth-2 with divisibility by 3';
      
      default:
        return 'Unknown calculation method';
    }
  }
};