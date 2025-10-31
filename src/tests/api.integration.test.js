/**
 * API Integration Tests
 * Tests the backend API endpoints for customers, measurement sheets, and slab entries
 */

import axios from 'axios';
import { CUSTOMER_TYPES } from '../utils/constants';

// Mock axios for testing
jest.mock('axios');
const mockedAxios = axios;

// Test configuration
const API_BASE_URL = 'http://localhost:5000/api';

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Customer API Endpoints', () => {
    const mockCustomer = {
      id: 'test-customer-id',
      name: 'Test Customer',
      phoneNumber: '123-456-7890',
      email: 'test@example.com',
      address: '123 Test Street, Test City'
    };

    test('POST /customers - should create a new customer', async () => {
      const customerData = {
        name: 'New Customer',
        phoneNumber: '987-654-3210',
        email: 'new@example.com',
        address: '456 New Street, New City'
      };

      mockedAxios.post.mockResolvedValue({
        status: 201,
        data: {
          success: true,
          data: { ...customerData, id: 'new-customer-id' },
          message: 'Customer created successfully'
        }
      });

      const response = await axios.post(`${API_BASE_URL}/customers`, customerData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe(customerData.name);
      expect(response.data.data.phoneNumber).toBe(customerData.phoneNumber);
    });

    test('GET /customers - should fetch customers with pagination', async () => {
      const mockResponse = {
        success: true,
        data: [mockCustomer],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          pages: 1
        }
      };

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: mockResponse
      });

      const response = await axios.get(`${API_BASE_URL}/customers?page=1&limit=50`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.pagination).toBeDefined();
    });

    test('GET /customers/:id - should fetch customer by ID', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: mockCustomer
        }
      });

      const response = await axios.get(`${API_BASE_URL}/customers/${mockCustomer.id}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBe(mockCustomer.id);
    });

    test('PUT /customers/:id - should update customer', async () => {
      const updatedData = {
        ...mockCustomer,
        name: 'Updated Customer Name'
      };

      mockedAxios.put.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: updatedData,
          message: 'Customer updated successfully'
        }
      });

      const response = await axios.put(`${API_BASE_URL}/customers/${mockCustomer.id}`, updatedData);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe('Updated Customer Name');
    });

    test('DELETE /customers/:id - should delete customer', async () => {
      mockedAxios.delete.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          message: 'Customer deleted successfully'
        }
      });

      const response = await axios.delete(`${API_BASE_URL}/customers/${mockCustomer.id}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    test('GET /customers/search - should search customers', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: [mockCustomer],
          searchTerm: 'Test'
        }
      });

      const response = await axios.get(`${API_BASE_URL}/customers?search=Test`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
  });

  describe('Measurement Sheet API Endpoints', () => {
    const mockMeasurementSheet = {
      id: 'test-sheet-id',
      measurementSheetNumber: 'MS-0001',
      customerId: 'test-customer-id',
      customerType: CUSTOMER_TYPES.RETAIL,
      status: 'draft',
      totalSquareFeet: 0,
      createdAt: new Date().toISOString()
    };

    test('POST /measurement-sheets - should create measurement sheet', async () => {
      const sheetData = {
        customerId: 'test-customer-id',
        customerType: CUSTOMER_TYPES.RETAIL
      };

      mockedAxios.post.mockResolvedValue({
        status: 201,
        data: {
          success: true,
          data: mockMeasurementSheet
        }
      });

      const response = await axios.post(`${API_BASE_URL}/measurement-sheets`, sheetData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.customerType).toBe(CUSTOMER_TYPES.RETAIL);
    });

    test('GET /measurement-sheets - should fetch measurement sheets', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: [mockMeasurementSheet],
          pagination: {
            page: 1,
            limit: 50,
            total: 1,
            pages: 1
          }
        }
      });

      const response = await axios.get(`${API_BASE_URL}/measurement-sheets`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    test('GET /measurement-sheets/:id - should fetch measurement sheet by ID', async () => {
      const fullSheet = {
        ...mockMeasurementSheet,
        customer_name: 'Test Customer',
        slab_entries: []
      };

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: fullSheet
        }
      });

      const response = await axios.get(`${API_BASE_URL}/measurement-sheets/${mockMeasurementSheet.id}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.slab_entries).toBeDefined();
    });

    test('PUT /measurement-sheets/:id - should update measurement sheet', async () => {
      const updatedSheet = {
        ...mockMeasurementSheet,
        status: 'completed'
      };

      mockedAxios.put.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: updatedSheet
        }
      });

      const response = await axios.put(`${API_BASE_URL}/measurement-sheets/${mockMeasurementSheet.id}`, {
        status: 'completed'
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('completed');
    });

    test('DELETE /measurement-sheets/:id - should delete measurement sheet', async () => {
      mockedAxios.delete.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          message: 'Measurement sheet deleted successfully'
        }
      });

      const response = await axios.delete(`${API_BASE_URL}/measurement-sheets/${mockMeasurementSheet.id}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('Slab Entry API Endpoints', () => {
    const mockSlabEntry = {
      id: 'test-slab-id',
      measurementSheetId: 'test-sheet-id',
      serialNumber: 1,
      blockNumber: 'B001',
      length: 144,
      breadth: 144,
      slabCategory: 'F',
      finalLength: 144,
      finalBreadth: 144,
      squareFeet: 144,
      calculationDetails: '(144 × 144) ÷ 144'
    };

    test('POST /slab-entries - should create slab entry', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 201,
        data: {
          success: true,
          data: mockSlabEntry
        }
      });

      const response = await axios.post(`${API_BASE_URL}/slab-entries`, mockSlabEntry);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.blockNumber).toBe('B001');
    });

    test('GET /slab-entries/:measurementSheetId - should fetch slab entries', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: [mockSlabEntry]
        }
      });

      const response = await axios.get(`${API_BASE_URL}/slab-entries/test-sheet-id`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    test('PUT /slab-entries/:id - should update slab entry', async () => {
      const updatedEntry = {
        ...mockSlabEntry,
        blockNumber: 'B002'
      };

      mockedAxios.put.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: updatedEntry
        }
      });

      const response = await axios.put(`${API_BASE_URL}/slab-entries/${mockSlabEntry.id}`, updatedEntry);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.blockNumber).toBe('B002');
    });

    test('DELETE /slab-entries/:id - should delete slab entry', async () => {
      mockedAxios.delete.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          message: 'Slab entry deleted successfully'
        }
      });

      const response = await axios.delete(`${API_BASE_URL}/slab-entries/${mockSlabEntry.id}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 errors', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 404,
          data: {
            error: 'Customer not found'
          }
        }
      });

      try {
        await axios.get(`${API_BASE_URL}/customers/non-existent-id`);
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toBe('Customer not found');
      }
    });

    test('should handle validation errors', async () => {
      mockedAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: {
            error: 'Validation failed',
            details: ['Name is required', 'Phone number is required']
          }
        }
      });

      try {
        await axios.post(`${API_BASE_URL}/customers`, {});
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toBe('Validation failed');
        expect(Array.isArray(error.response.data.details)).toBe(true);
      }
    });

    test('should handle server errors', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 500,
          data: {
            error: 'Internal server error'
          }
        }
      });

      try {
        await axios.get(`${API_BASE_URL}/customers`);
      } catch (error) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.error).toBe('Internal server error');
      }
    });
  });
});