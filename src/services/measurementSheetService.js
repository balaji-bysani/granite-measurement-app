import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';

// Mock data for development when backend is not available
const MOCK_DATA_ENABLED = true;

// Measurement sheet service for API calls
export const measurementSheetService = {
  /**
   * Create a new measurement sheet
   * @param {string} customerType - Customer type
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} - Created measurement sheet
   */
  async createMeasurementSheet(customerType, customerId) {
    if (MOCK_DATA_ENABLED) {
      // Return mock data for development
      return {
        id: `ms_${Date.now()}`,
        measurementSheetNumber: `MS-${String(Date.now()).slice(-4)}`,
        customerType,
        customerId,
        status: 'draft',
        createdAt: new Date().toISOString(),
        slabEntries: []
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEASUREMENT_SHEETS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerType,
          customerId,
          status: 'draft'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating measurement sheet:', error);
      throw error;
    }
  },

  /**
   * Get measurement sheet by ID
   * @param {string} id - Measurement sheet ID
   * @returns {Promise<Object>} - Measurement sheet data
   */
  async getMeasurementSheet(id) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEASUREMENT_SHEETS}/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching measurement sheet:', error);
      // For development, return mock data
      return {
        id,
        measurementSheetNumber: `MS-${String(Date.now()).slice(-4)}`,
        customerType: 'retail',
        customerId: 'customer_1',
        status: 'draft',
        createdAt: new Date().toISOString(),
        customer: {
          id: 'customer_1',
          name: 'Sample Customer',
          phoneNumber: '123-456-7890',
          email: 'customer@example.com',
          address: '123 Main St, City, State'
        },
        slabEntries: []
      };
    }
  },

  /**
   * Update measurement sheet
   * @param {string} id - Measurement sheet ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Updated measurement sheet
   */
  async updateMeasurementSheet(id, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEASUREMENT_SHEETS}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating measurement sheet:', error);
      // For development, return success
      return { success: true, id, ...data };
    }
  },

  /**
   * Add slab entry to measurement sheet
   * @param {string} sheetId - Measurement sheet ID
   * @param {Object} slabEntry - Slab entry data
   * @returns {Promise<Object>} - Created slab entry
   */
  async addSlabEntry(sheetId, slabEntry) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SLAB_ENTRIES}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...slabEntry,
          measurementSheetId: sheetId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding slab entry:', error);
      // For development, return mock data
      return {
        ...slabEntry,
        id: `slab_${Date.now()}_${Math.random()}`,
        measurementSheetId: sheetId,
        createdAt: new Date().toISOString()
      };
    }
  },

  /**
   * Update slab entry
   * @param {string} entryId - Slab entry ID
   * @param {Object} slabEntry - Updated slab entry data
   * @returns {Promise<Object>} - Updated slab entry
   */
  async updateSlabEntry(entryId, slabEntry) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SLAB_ENTRIES}/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slabEntry),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating slab entry:', error);
      // For development, return success
      return { ...slabEntry, id: entryId };
    }
  },

  /**
   * Delete slab entry
   * @param {string} entryId - Slab entry ID
   * @returns {Promise<Object>} - Delete result
   */
  async deleteSlabEntry(entryId) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SLAB_ENTRIES}/${entryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting slab entry:', error);
      // For development, return success
      return { success: true, id: entryId };
    }
  },

  /**
   * Search measurement sheets with pagination and filters
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object>} - Paginated measurement sheets with metadata
   */
  async searchMeasurementSheets(criteria = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add all criteria to query params
      Object.keys(criteria).forEach(key => {
        if (criteria[key] !== undefined && criteria[key] !== null && criteria[key] !== '') {
          queryParams.append(key, criteria[key]);
        }
      });

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEASUREMENT_SHEETS}?${queryParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching measurement sheets:', error);
      // For development, return mock paginated data
      return {
        success: true,
        data: [
          {
            id: 'ms_1',
            measurement_sheet_number: 'MS-0001',
            customer_name: 'John Doe',
            customer_phone: '123-456-7890',
            customer_type: 'Retail',
            total_square_feet: 125.50,
            status: 'completed',
            created_at: new Date().toISOString()
          },
          {
            id: 'ms_2',
            measurement_sheet_number: 'MS-0002',
            customer_name: 'Jane Smith',
            customer_phone: '098-765-4321',
            customer_type: 'Granite Shops',
            total_square_feet: 89.25,
            status: 'draft',
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          pages: 1
        }
      };
    }
  },

  /**
   * Delete measurement sheet
   * @param {string} id - Measurement sheet ID
   * @returns {Promise<Object>} - Delete result
   */
  async deleteMeasurementSheet(id) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEASUREMENT_SHEETS}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting measurement sheet:', error);
      // For development, return success
      return { success: true, message: 'Measurement sheet deleted successfully' };
    }
  },

  /**
   * Export measurement sheet to PDF
   * @param {string} id - Measurement sheet ID
   * @returns {Promise<Blob>} - PDF blob
   */
  async exportToPDF(id) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEASUREMENT_SHEETS}/${id}/export/pdf`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  },

  /**
   * Export measurement sheet to CSV
   * @param {string} id - Measurement sheet ID
   * @returns {Promise<string>} - CSV data
   */
  async exportToCSV(id) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEASUREMENT_SHEETS}/${id}/export/csv`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }
};