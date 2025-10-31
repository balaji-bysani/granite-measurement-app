/**
 * Validation middleware for API endpoints
 */

/**
 * Validate UUID format
 */
const validateUUID = (paramName) => {
  return (req, res, next) => {
    const uuid = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(uuid)) {
      return res.status(400).json({
        error: 'Invalid UUID format',
        field: paramName
      });
    }
    
    next();
  };
};

/**
 * Validate required fields in request body
 */
const validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!req.body[field] && req.body[field] !== 0) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
    }
    
    next();
  };
};

/**
 * Validate customer data
 */
const validateCustomerData = (req, res, next) => {
  const { name, phoneNumber, address } = req.body;
  const errors = [];
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }
  
  if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0) {
    errors.push('Phone number is required and must be a non-empty string');
  }
  
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    errors.push('Address is required and must be a non-empty string');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }
  
  // Trim whitespace
  req.body.name = name.trim();
  req.body.phoneNumber = phoneNumber.trim();
  req.body.address = address.trim();
  if (req.body.email) {
    req.body.email = req.body.email.trim();
  }
  
  next();
};

/**
 * Validate measurement sheet data
 */
const validateMeasurementSheetData = (req, res, next) => {
  const { customerId, customerType } = req.body;
  const errors = [];
  
  if (!customerId) {
    errors.push('Customer ID is required');
  }
  
  const validCustomerTypes = ['Retail', 'Granite Shops', 'Builders', 'Outstation Parties', 'Exporters'];
  if (!customerType || !validCustomerTypes.includes(customerType)) {
    errors.push(`Customer type must be one of: ${validCustomerTypes.join(', ')}`);
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }
  
  next();
};

/**
 * Validate slab entry data
 */
const validateSlabEntryData = (req, res, next) => {
  const { 
    measurementSheetId, 
    blockNumber, 
    length, 
    breadth, 
    slabCategory 
  } = req.body;
  const errors = [];
  
  if (!measurementSheetId) {
    errors.push('Measurement sheet ID is required');
  }
  
  if (!blockNumber || typeof blockNumber !== 'string' || blockNumber.trim().length === 0) {
    errors.push('Block number is required and must be a non-empty string');
  } else if (blockNumber.trim().length > 50) {
    errors.push('Block number must be less than 50 characters');
  }
  
  if (length === null || length === undefined) {
    errors.push('Length is required');
  } else {
    const numLength = parseFloat(length);
    if (isNaN(numLength)) {
      errors.push('Length must be a valid number');
    } else if (numLength <= 0) {
      errors.push('Length must be greater than 0');
    } else if (numLength > 10000) {
      errors.push('Length cannot exceed 10,000 inches');
    }
  }
  
  if (breadth === null || breadth === undefined) {
    errors.push('Breadth is required');
  } else {
    const numBreadth = parseFloat(breadth);
    if (isNaN(numBreadth)) {
      errors.push('Breadth must be a valid number');
    } else if (numBreadth <= 0) {
      errors.push('Breadth must be greater than 0');
    } else if (numBreadth > 10000) {
      errors.push('Breadth cannot exceed 10,000 inches');
    }
  }
  
  const validCategories = ['F', 'LD', 'D', 'S'];
  if (!slabCategory || !validCategories.includes(slabCategory)) {
    errors.push(`Slab category must be one of: ${validCategories.join(', ')}`);
  }
  
  if (errors.length > 0) {
    return res.status(422).json({
      error: 'Validation failed',
      details: errors,
      field_errors: {
        measurementSheetId: !measurementSheetId ? 'Required' : null,
        blockNumber: !blockNumber || blockNumber.trim().length === 0 ? 'Required' : 
                    blockNumber.trim().length > 50 ? 'Too long' : null,
        length: length === null || length === undefined ? 'Required' : 
               isNaN(parseFloat(length)) ? 'Invalid number' :
               parseFloat(length) <= 0 ? 'Must be positive' :
               parseFloat(length) > 10000 ? 'Too large' : null,
        breadth: breadth === null || breadth === undefined ? 'Required' : 
                isNaN(parseFloat(breadth)) ? 'Invalid number' :
                parseFloat(breadth) <= 0 ? 'Must be positive' :
                parseFloat(breadth) > 10000 ? 'Too large' : null,
        slabCategory: !slabCategory || !validCategories.includes(slabCategory) ? 'Invalid category' : null
      }
    });
  }
  
  // Sanitize and convert data
  req.body.blockNumber = blockNumber.trim();
  req.body.length = parseFloat(length);
  req.body.breadth = parseFloat(breadth);
  
  next();
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const { page, limit, sortBy, sortOrder } = req.query;
  
  if (page) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        error: 'Page must be a positive integer'
      });
    }
    req.query.page = pageNum;
  }
  
  if (limit) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: 'Limit must be a positive integer between 1 and 100'
      });
    }
    req.query.limit = limitNum;
  }
  
  // Validate sort parameters
  if (sortBy) {
    const validSortFields = ['name', 'phone_number', 'email', 'created_at', 'updated_at'];
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        error: 'Invalid sort field',
        validFields: validSortFields
      });
    }
  }
  
  if (sortOrder) {
    const validSortOrders = ['ASC', 'DESC', 'asc', 'desc'];
    if (!validSortOrders.includes(sortOrder)) {
      return res.status(400).json({
        error: 'Invalid sort order',
        validOrders: ['ASC', 'DESC']
      });
    }
  }
  
  next();
};

/**
 * Validate customer search parameters
 */
const validateCustomerSearch = (req, res, next) => {
  const { search } = req.query;
  
  if (search && typeof search !== 'string') {
    return res.status(400).json({
      error: 'Search term must be a string'
    });
  }
  
  if (search && search.length > 100) {
    return res.status(400).json({
      error: 'Search term must be less than 100 characters'
    });
  }
  
  next();
};

/**
 * Validate limit parameter for frequently accessed customers
 */
const validateLimit = (req, res, next) => {
  const { limit } = req.query;
  
  if (limit) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({
        error: 'Limit must be a positive integer between 1 and 50'
      });
    }
    req.query.limit = limitNum;
  }
  
  next();
};

module.exports = {
  validateUUID,
  validateRequiredFields,
  validateCustomerData,
  validateMeasurementSheetData,
  validateSlabEntryData,
  validatePagination,
  validateCustomerSearch,
  validateLimit
};