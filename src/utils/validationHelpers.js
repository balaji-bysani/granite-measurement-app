/**
 * Validation helper functions for form inputs and data validation
 * Provides consistent validation logic across the application
 */

/**
 * Validate positive number input
 */
export const validatePositiveNumber = (value, fieldName = 'Value') => {
  const errors = [];
  
  if (value === null || value === undefined || value === '') {
    errors.push(`${fieldName} is required`);
    return errors;
  }
  
  const numValue = parseFloat(value);
  
  if (isNaN(numValue)) {
    errors.push(`${fieldName} must be a valid number`);
  } else if (numValue <= 0) {
    errors.push(`${fieldName} must be greater than 0`);
  } else if (numValue > 10000) {
    errors.push(`${fieldName} must be less than 10,000`);
  }
  
  return errors;
};

/**
 * Validate required string field
 */
export const validateRequiredString = (value, fieldName = 'Field', minLength = 1, maxLength = 255) => {
  const errors = [];
  
  if (!value || typeof value !== 'string') {
    errors.push(`${fieldName} is required`);
    return errors;
  }
  
  const trimmedValue = value.trim();
  
  if (trimmedValue.length < minLength) {
    errors.push(`${fieldName} must be at least ${minLength} character${minLength > 1 ? 's' : ''}`);
  }
  
  if (trimmedValue.length > maxLength) {
    errors.push(`${fieldName} must be less than ${maxLength} characters`);
  }
  
  return errors;
};

/**
 * Validate email format
 */
export const validateEmail = (email, required = false) => {
  const errors = [];
  
  if (!email || email.trim() === '') {
    if (required) {
      errors.push('Email is required');
    }
    return errors;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    errors.push('Please enter a valid email address');
  }
  
  if (email.length > 100) {
    errors.push('Email must be less than 100 characters');
  }
  
  return errors;
};

/**
 * Validate phone number
 */
export const validatePhoneNumber = (phoneNumber, required = true) => {
  const errors = [];
  
  if (!phoneNumber || phoneNumber.trim() === '') {
    if (required) {
      errors.push('Phone number is required');
    }
    return errors;
  }
  
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  if (cleanPhone.length < 10) {
    errors.push('Phone number must be at least 10 digits');
  }
  
  if (cleanPhone.length > 15) {
    errors.push('Phone number must be less than 15 digits');
  }
  
  // Basic format validation
  const phoneRegex = /^[0-9+\-\s()]+$/;
  if (!phoneRegex.test(phoneNumber)) {
    errors.push('Phone number contains invalid characters');
  }
  
  return errors;
};

/**
 * Validate slab category
 */
export const validateSlabCategory = (category, required = true) => {
  const errors = [];
  const validCategories = ['F', 'LD', 'D', 'S'];
  
  if (!category || category.trim() === '') {
    if (required) {
      errors.push('Slab category is required');
    }
    return errors;
  }
  
  if (!validCategories.includes(category)) {
    errors.push(`Slab category must be one of: ${validCategories.join(', ')}`);
  }
  
  return errors;
};

/**
 * Validate customer type
 */
export const validateCustomerType = (customerType, required = true) => {
  const errors = [];
  const validTypes = ['Retail', 'Granite Shops', 'Builders', 'Outstation Parties', 'Exporters'];
  
  if (!customerType || customerType.trim() === '') {
    if (required) {
      errors.push('Customer type is required');
    }
    return errors;
  }
  
  if (!validTypes.includes(customerType)) {
    errors.push(`Customer type must be one of: ${validTypes.join(', ')}`);
  }
  
  return errors;
};

/**
 * Validate UUID format
 */
export const validateUUID = (uuid, fieldName = 'ID') => {
  const errors = [];
  
  if (!uuid) {
    errors.push(`${fieldName} is required`);
    return errors;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(uuid)) {
    errors.push(`${fieldName} must be a valid UUID`);
  }
  
  return errors;
};

/**
 * Validate slab entry data
 */
export const validateSlabEntry = (slabEntry) => {
  const errors = {};
  
  // Validate block number
  const blockErrors = validateRequiredString(slabEntry.blockNumber, 'Block number', 1, 50);
  if (blockErrors.length > 0) {
    errors.blockNumber = blockErrors[0];
  }
  
  // Validate length
  const lengthErrors = validatePositiveNumber(slabEntry.length, 'Length');
  if (lengthErrors.length > 0) {
    errors.length = lengthErrors[0];
  }
  
  // Validate breadth
  const breadthErrors = validatePositiveNumber(slabEntry.breadth, 'Breadth');
  if (breadthErrors.length > 0) {
    errors.breadth = breadthErrors[0];
  }
  
  // Validate slab category
  const categoryErrors = validateSlabCategory(slabEntry.slabCategory);
  if (categoryErrors.length > 0) {
    errors.slabCategory = categoryErrors[0];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate customer data
 */
export const validateCustomer = (customerData) => {
  const errors = {};
  
  // Validate name
  const nameErrors = validateRequiredString(customerData.name, 'Customer name', 2, 100);
  if (nameErrors.length > 0) {
    errors.name = nameErrors[0];
  }
  
  // Validate phone number
  const phoneErrors = validatePhoneNumber(customerData.phoneNumber);
  if (phoneErrors.length > 0) {
    errors.phoneNumber = phoneErrors[0];
  }
  
  // Validate email (optional)
  const emailErrors = validateEmail(customerData.email, false);
  if (emailErrors.length > 0) {
    errors.email = emailErrors[0];
  }
  
  // Validate address
  const addressErrors = validateRequiredString(customerData.address, 'Address', 5, 500);
  if (addressErrors.length > 0) {
    errors.address = addressErrors[0];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate measurement sheet data
 */
export const validateMeasurementSheet = (measurementSheetData) => {
  const errors = {};
  
  // Validate customer ID
  const customerIdErrors = validateUUID(measurementSheetData.customerId, 'Customer ID');
  if (customerIdErrors.length > 0) {
    errors.customerId = customerIdErrors[0];
  }
  
  // Validate customer type
  const customerTypeErrors = validateCustomerType(measurementSheetData.customerType);
  if (customerTypeErrors.length > 0) {
    errors.customerType = customerTypeErrors[0];
  }
  
  // Validate slab entries if provided
  if (measurementSheetData.slabEntries && Array.isArray(measurementSheetData.slabEntries)) {
    const slabEntryErrors = [];
    
    measurementSheetData.slabEntries.forEach((entry, index) => {
      const entryValidation = validateSlabEntry(entry);
      if (!entryValidation.isValid) {
        slabEntryErrors.push({
          index,
          errors: entryValidation.errors
        });
      }
    });
    
    if (slabEntryErrors.length > 0) {
      errors.slabEntries = slabEntryErrors;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitize string input to prevent XSS
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors) => {
  if (Array.isArray(errors)) {
    return errors.join(', ');
  }
  
  if (typeof errors === 'object' && errors !== null) {
    return Object.values(errors).flat().join(', ');
  }
  
  return errors?.toString() || 'Validation error';
};

/**
 * Debounce validation function
 */
export const createDebouncedValidator = (validator, delay = 300) => {
  let timeoutId;
  
  return (...args) => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        resolve(validator(...args));
      }, delay);
    });
  };
};