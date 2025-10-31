const Customer = require('../models/Customer');
const { asyncErrorHandler, createErrorResponse } = require('../middleware/errorHandler');

/**
 * Customer Controller
 * High-performance customer management with optimized queries and caching
 */

/**
 * Create a new customer with validation and caching
 */
const createCustomer = asyncErrorHandler(async (req, res) => {
  const { name, phoneNumber, email, address } = req.body;
  
  // Validate customer data using model validation
  const validationErrors = Customer.validateData({ name, phoneNumber, email, address });
  if (validationErrors.length > 0) {
    throw createErrorResponse('Validation failed', 422, validationErrors);
  }
  
  // Check for duplicate phone number (business rule)
  const existingCustomers = await Customer.search(phoneNumber, { limit: 1 });
  if (existingCustomers.customers.length > 0) {
    const existing = existingCustomers.customers[0];
    if (existing.phoneNumber === phoneNumber.trim()) {
      throw createErrorResponse(
        'Customer with this phone number already exists', 
        409, 
        { existingCustomer: existing.toJSON() }
      );
    }
  }
  
  const customer = await Customer.create({
    name: name.trim(),
    phoneNumber: phoneNumber.trim(),
    email: email ? email.trim() : null,
    address: address.trim()
  });
  
  res.status(201).json({
    success: true,
    data: customer.toJSON(),
    message: 'Customer created successfully'
  });
});

/**
 * Get customers with advanced search, pagination, and caching
 */
const getCustomers = async (req, res) => {
  try {
    const { 
      search, 
      page = 1, 
      limit = 50, 
      sortBy = 'created_at', 
      sortOrder = 'DESC' 
    } = req.query;
    
    // Validate sort parameters
    const validSortFields = ['name', 'phone_number', 'email', 'created_at', 'updated_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        error: 'Invalid sort field',
        validFields: validSortFields
      });
    }
    
    if (!validSortOrders.includes(sortOrder.toUpperCase())) {
      return res.status(400).json({
        error: 'Invalid sort order',
        validOrders: validSortOrders
      });
    }
    
    const result = await Customer.search(search, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder: sortOrder.toUpperCase()
    });
    
    res.json({
      success: true,
      data: result.customers.map(customer => customer.toJSON()),
      pagination: result.pagination,
      searchTerm: search || null
    });
    
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      error: 'Failed to fetch customers',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get customer by ID with caching
 */
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findById(id);
    
    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
        message: `No customer found with ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      data: customer.toJSON()
    });
    
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      error: 'Failed to fetch customer',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update customer with validation and cache management
 */
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber, email, address } = req.body;
    
    // Validate customer data
    const validationErrors = Customer.validateData({ name, phoneNumber, email, address });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    // Find existing customer
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
        message: `No customer found with ID: ${id}`
      });
    }
    
    // Check for duplicate phone number (if phone number is being changed)
    if (phoneNumber.trim() !== customer.phoneNumber) {
      const existingCustomers = await Customer.search(phoneNumber, { limit: 1 });
      if (existingCustomers.customers.length > 0) {
        const existing = existingCustomers.customers[0];
        if (existing.phoneNumber === phoneNumber.trim() && existing.id !== id) {
          return res.status(409).json({
            error: 'Customer with this phone number already exists',
            existingCustomer: existing.toJSON()
          });
        }
      }
    }
    
    // Update customer
    const updatedCustomer = await customer.update({
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email ? email.trim() : null,
      address: address.trim()
    });
    
    res.json({
      success: true,
      data: updatedCustomer.toJSON(),
      message: 'Customer updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      error: 'Failed to update customer',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Delete customer with proper validation and cache cleanup
 */
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
        message: `No customer found with ID: ${id}`
      });
    }
    
    await customer.delete();
    
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting customer:', error);
    
    if (error.message.includes('Cannot delete customer with existing measurement sheets')) {
      return res.status(409).json({
        error: 'Cannot delete customer',
        message: 'Customer has existing measurement sheets and cannot be deleted'
      });
    }
    
    res.status(500).json({
      error: 'Failed to delete customer',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get frequently accessed customers
 */
const getFrequentlyAccessedCustomers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const customers = await Customer.getFrequentlyAccessed(parseInt(limit));
    
    res.json({
      success: true,
      data: customers.map(customer => customer.toJSON()),
      message: `Top ${customers.length} frequently accessed customers`
    });
    
  } catch (error) {
    console.error('Error fetching frequently accessed customers:', error);
    res.status(500).json({
      error: 'Failed to fetch frequently accessed customers',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get customer statistics
 */
const getCustomerStatistics = async (req, res) => {
  try {
    const statistics = await Customer.getStatistics();
    
    res.json({
      success: true,
      data: statistics,
      message: 'Customer statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching customer statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch customer statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getFrequentlyAccessedCustomers,
  getCustomerStatistics
};