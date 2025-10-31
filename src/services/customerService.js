import { apiRequest } from './api';

// Mock data for development when backend is not available
const MOCK_DATA_ENABLED = true;

// Mock customers data
const mockCustomers = [
  {
    id: 'customer_1',
    name: 'John Doe',
    phoneNumber: '123-456-7890',
    email: 'john.doe@example.com',
    address: '123 Main St, City, State 12345',
    createdAt: new Date().toISOString()
  },
  {
    id: 'customer_2',
    name: 'Jane Smith',
    phoneNumber: '098-765-4321',
    email: 'jane.smith@example.com',
    address: '456 Oak Ave, Town, State 67890',
    createdAt: new Date().toISOString()
  },
  {
    id: 'customer_3',
    name: 'ABC Granite Works',
    phoneNumber: '555-123-4567',
    email: 'info@abcgranite.com',
    address: '789 Industrial Blvd, City, State 11111',
    createdAt: new Date().toISOString()
  }
];

/**
 * Customer service for API calls
 * Handles all customer-related API operations with error handling
 */
export const customerService = {
  /**
   * Create a new customer
   * @param {Object} customerData - Customer information
   * @returns {Promise<Object>} Created customer data
   */
  async createCustomer(customerData) {
    if (MOCK_DATA_ENABLED) {
      // Create mock customer
      const newCustomer = {
        id: `customer_${Date.now()}`,
        ...customerData,
        createdAt: new Date().toISOString()
      };
      mockCustomers.push(newCustomer);
      return newCustomer;
    }

    try {
      const response = await apiRequest.post('/customers', customerData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  /**
   * Search customers with debounced functionality
   * @param {string} searchTerm - Search term for name, phone, or email
   * @param {Object} options - Search options (page, limit, sortBy, sortOrder)
   * @returns {Promise<Array>} Array of matching customers
   */
  async searchCustomers(searchTerm, options = {}) {
    if (MOCK_DATA_ENABLED) {
      // Filter mock customers based on search term
      let filteredCustomers = mockCustomers;
      
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredCustomers = mockCustomers.filter(customer =>
          customer.name.toLowerCase().includes(term) ||
          customer.phoneNumber.includes(term) ||
          (customer.email && customer.email.toLowerCase().includes(term))
        );
      }
      
      return filteredCustomers.slice(0, options.limit || 10);
    }

    try {
      const params = {
        search: searchTerm,
        page: options.page || 1,
        limit: options.limit || 10,
        sortBy: options.sortBy || 'name',
        sortOrder: options.sortOrder || 'ASC'
      };

      const response = await apiRequest.get('/customers', { params });
      return response.data.data;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  },

  /**
   * Get customer by ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Customer data
   */
  async getCustomerById(customerId) {
    try {
      const response = await apiRequest.get(`/customers/${customerId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },

  /**
   * Update customer information
   * @param {string} customerId - Customer ID
   * @param {Object} customerData - Updated customer information
   * @returns {Promise<Object>} Updated customer data
   */
  async updateCustomer(customerId, customerData) {
    try {
      const response = await apiRequest.put(`/customers/${customerId}`, customerData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  /**
   * Delete customer
   * @param {string} customerId - Customer ID
   * @returns {Promise<void>}
   */
  async deleteCustomer(customerId) {
    try {
      await apiRequest.delete(`/customers/${customerId}`);
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },

  /**
   * Get all customers with pagination
   * @param {Object} options - Query options (page, limit, sortBy, sortOrder)
   * @returns {Promise<Object>} Customers data with pagination info
   */
  async getCustomers(options = {}) {
    try {
      const params = {
        page: options.page || 1,
        limit: options.limit || 50,
        sortBy: options.sortBy || 'created_at',
        sortOrder: options.sortOrder || 'DESC'
      };

      const response = await apiRequest.get('/customers', { params });
      return {
        customers: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  /**
   * Get frequently accessed customers
   * @param {number} limit - Number of customers to return
   * @returns {Promise<Array>} Array of frequently accessed customers
   */
  async getFrequentlyAccessedCustomers(limit = 10) {
    try {
      const response = await apiRequest.get('/customers/frequent', { 
        params: { limit } 
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching frequently accessed customers:', error);
      throw error;
    }
  },

  /**
   * Get customer statistics
   * @returns {Promise<Object>} Customer statistics
   */
  async getCustomerStatistics() {
    try {
      const response = await apiRequest.get('/customers/statistics');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching customer statistics:', error);
      throw error;
    }
  }
};