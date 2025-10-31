/**
 * User Workflow Integration Tests
 * Tests complete user workflows from start to finish
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { calculationEngine } from '../utils/calculationEngine';
import { CUSTOMER_TYPES } from '../utils/constants';

// Mock components for testing workflows
const MockCustomerSelectionInterface = ({ onCustomerSelect, onCustomerTypeSelect }) => (
  <div data-testid="customer-selection">
    <div>
      <label>
        <input 
          type="radio" 
          name="customerType" 
          value={CUSTOMER_TYPES.RETAIL}
          onChange={(e) => onCustomerTypeSelect(e.target.value)}
        />
        Retail
      </label>
      <label>
        <input 
          type="radio" 
          name="customerType" 
          value={CUSTOMER_TYPES.GRANITE_SHOPS}
          onChange={(e) => onCustomerTypeSelect(e.target.value)}
        />
        Granite Shops
      </label>
    </div>
    <button onClick={() => onCustomerSelect({ id: 'test-customer', name: 'Test Customer' })}>
      Select Customer
    </button>
  </div>
);

const MockSlabEntryForm = ({ customerType, onSlabAdd }) => {
  const [formData, setFormData] = React.useState({
    blockNumber: '',
    length: '',
    breadth: '',
    slabCategory: 'F'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const calculation = calculationEngine.calculateSquareFeet(
      parseFloat(formData.length),
      parseFloat(formData.breadth),
      customerType
    );
    
    onSlabAdd({
      ...formData,
      ...calculation,
      serialNumber: Date.now()
    });
  };

  return (
    <form data-testid="slab-entry-form" onSubmit={handleSubmit}>
      <input
        data-testid="block-number"
        placeholder="Block Number"
        value={formData.blockNumber}
        onChange={(e) => setFormData({ ...formData, blockNumber: e.target.value })}
      />
      <input
        data-testid="length"
        type="number"
        placeholder="Length"
        value={formData.length}
        onChange={(e) => setFormData({ ...formData, length: e.target.value })}
      />
      <input
        data-testid="breadth"
        type="number"
        placeholder="Breadth"
        value={formData.breadth}
        onChange={(e) => setFormData({ ...formData, breadth: e.target.value })}
      />
      <select
        data-testid="slab-category"
        value={formData.slabCategory}
        onChange={(e) => setFormData({ ...formData, slabCategory: e.target.value })}
      >
        <option value="F">F</option>
        <option value="LD">LD</option>
        <option value="D">D</option>
        <option value="S">S</option>
      </select>
      <button type="submit">Add Slab</button>
    </form>
  );
};

const MockMeasurementSheetWorkflow = () => {
  const [step, setStep] = React.useState('customer-selection');
  const [customerType, setCustomerType] = React.useState('');
  const [customer, setCustomer] = React.useState(null);
  const [slabEntries, setSlabEntries] = React.useState([]);
  const [totalSquareFeet, setTotalSquareFeet] = React.useState(0);

  const handleCustomerTypeSelect = (type) => {
    setCustomerType(type);
  };

  const handleCustomerSelect = (selectedCustomer) => {
    setCustomer(selectedCustomer);
    setStep('measurement-entry');
  };

  const handleSlabAdd = (slabEntry) => {
    const newEntries = [...slabEntries, slabEntry];
    setSlabEntries(newEntries);
    
    const total = newEntries.reduce((sum, entry) => sum + entry.squareFeet, 0);
    setTotalSquareFeet(total);
  };

  const handleComplete = () => {
    setStep('completed');
  };

  return (
    <BrowserRouter>
      <div data-testid="measurement-sheet-workflow">
        {step === 'customer-selection' && (
          <MockCustomerSelectionInterface
            onCustomerSelect={handleCustomerSelect}
            onCustomerTypeSelect={handleCustomerTypeSelect}
          />
        )}
        
        {step === 'measurement-entry' && (
          <div data-testid="measurement-entry">
            <div data-testid="customer-info">
              Customer: {customer?.name} | Type: {customerType}
            </div>
            <MockSlabEntryForm
              customerType={customerType}
              onSlabAdd={handleSlabAdd}
            />
            <div data-testid="slab-entries-list">
              {slabEntries.map((entry, index) => (
                <div key={index} data-testid={`slab-entry-${index}`}>
                  {entry.blockNumber} - {entry.squareFeet} sq ft
                </div>
              ))}
            </div>
            <div data-testid="total-square-feet">
              Total: {totalSquareFeet.toFixed(2)} sq ft
            </div>
            <button onClick={handleComplete}>Complete Sheet</button>
          </div>
        )}
        
        {step === 'completed' && (
          <div data-testid="completed-sheet">
            <h2>Measurement Sheet Completed</h2>
            <div>Customer: {customer?.name}</div>
            <div>Type: {customerType}</div>
            <div>Total Slabs: {slabEntries.length}</div>
            <div>Total Square Feet: {totalSquareFeet.toFixed(2)}</div>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
};

describe('User Workflow Integration Tests', () => {
  describe('Complete Measurement Sheet Creation Workflow', () => {
    test('should complete retail customer workflow', async () => {
      const user = userEvent.setup();
      render(<MockMeasurementSheetWorkflow />);

      // Step 1: Select customer type
      expect(screen.getByTestId('customer-selection')).toBeInTheDocument();
      
      const retailRadio = screen.getByLabelText('Retail');
      await user.click(retailRadio);
      
      // Step 2: Select customer
      const selectCustomerBtn = screen.getByText('Select Customer');
      await user.click(selectCustomerBtn);

      // Step 3: Verify measurement entry screen
      await waitFor(() => {
        expect(screen.getByTestId('measurement-entry')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('customer-info')).toHaveTextContent('Customer: Test Customer | Type: retail');

      // Step 4: Add slab entries
      const blockNumberInput = screen.getByTestId('block-number');
      const lengthInput = screen.getByTestId('length');
      const breadthInput = screen.getByTestId('breadth');
      const addSlabBtn = screen.getByText('Add Slab');

      // Add first slab
      await user.type(blockNumberInput, 'B001');
      await user.type(lengthInput, '144');
      await user.type(breadthInput, '144');
      await user.click(addSlabBtn);

      // Verify slab was added
      await waitFor(() => {
        expect(screen.getByTestId('slab-entry-0')).toHaveTextContent('B001 - 144 sq ft');
      });

      // Add second slab
      await user.clear(blockNumberInput);
      await user.clear(lengthInput);
      await user.clear(breadthInput);
      
      await user.type(blockNumberInput, 'B002');
      await user.type(lengthInput, '100');
      await user.type(breadthInput, '50');
      await user.click(addSlabBtn);

      // Verify second slab and total
      await waitFor(() => {
        expect(screen.getByTestId('slab-entry-1')).toHaveTextContent('B002 - 34.72 sq ft');
        expect(screen.getByTestId('total-square-feet')).toHaveTextContent('Total: 178.72 sq ft');
      });

      // Step 5: Complete the sheet
      const completeBtn = screen.getByText('Complete Sheet');
      await user.click(completeBtn);

      // Step 6: Verify completion
      await waitFor(() => {
        expect(screen.getByTestId('completed-sheet')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Measurement Sheet Completed')).toBeInTheDocument();
      expect(screen.getByText('Customer: Test Customer')).toBeInTheDocument();
      expect(screen.getByText('Type: retail')).toBeInTheDocument();
      expect(screen.getByText('Total Slabs: 2')).toBeInTheDocument();
      expect(screen.getByText('Total Square Feet: 178.72')).toBeInTheDocument();
    });

    test('should complete granite shops workflow with calculation adjustments', async () => {
      const user = userEvent.setup();
      render(<MockMeasurementSheetWorkflow />);

      // Select Granite Shops customer type
      const graniteShopsRadio = screen.getByLabelText('Granite Shops');
      await user.click(graniteShopsRadio);
      
      const selectCustomerBtn = screen.getByText('Select Customer');
      await user.click(selectCustomerBtn);

      await waitFor(() => {
        expect(screen.getByTestId('measurement-entry')).toBeInTheDocument();
      });

      // Add slab with granite shops calculation
      const blockNumberInput = screen.getByTestId('block-number');
      const lengthInput = screen.getByTestId('length');
      const breadthInput = screen.getByTestId('breadth');
      const addSlabBtn = screen.getByText('Add Slab');

      await user.type(blockNumberInput, 'GS001');
      await user.type(lengthInput, '150'); // Will be adjusted to 147, then 144 for divisibility by 3
      await user.type(breadthInput, '146'); // Will be adjusted to 144, then 144 for divisibility by 3
      await user.click(addSlabBtn);

      // Verify granite shops calculation (144 * 144 / 144 = 144)
      await waitFor(() => {
        expect(screen.getByTestId('slab-entry-0')).toHaveTextContent('GS001 - 144 sq ft');
      });

      const completeBtn = screen.getByText('Complete Sheet');
      await user.click(completeBtn);

      await waitFor(() => {
        expect(screen.getByText('Type: granite_shops')).toBeInTheDocument();
        expect(screen.getByText('Total Square Feet: 144.00')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid slab dimensions', async () => {
      const user = userEvent.setup();
      render(<MockMeasurementSheetWorkflow />);

      // Complete customer selection
      const retailRadio = screen.getByLabelText('Retail');
      await user.click(retailRadio);
      
      const selectCustomerBtn = screen.getByText('Select Customer');
      await user.click(selectCustomerBtn);

      await waitFor(() => {
        expect(screen.getByTestId('measurement-entry')).toBeInTheDocument();
      });

      // Try to add slab with invalid dimensions
      const blockNumberInput = screen.getByTestId('block-number');
      const lengthInput = screen.getByTestId('length');
      const breadthInput = screen.getByTestId('breadth');
      const addSlabBtn = screen.getByText('Add Slab');

      await user.type(blockNumberInput, 'INVALID');
      await user.type(lengthInput, '0'); // Invalid length
      await user.type(breadthInput, '100');

      // The form should handle validation (in real implementation)
      // For this test, we verify the calculation engine throws an error
      expect(() => {
        calculationEngine.calculateSquareFeet(0, 100, CUSTOMER_TYPES.RETAIL);
      }).toThrow('Validation failed');
    });

    test('should handle very small dimensions that result in zero after processing', async () => {
      const user = userEvent.setup();
      render(<MockMeasurementSheetWorkflow />);

      const graniteShopsRadio = screen.getByLabelText('Granite Shops');
      await user.click(graniteShopsRadio);
      
      const selectCustomerBtn = screen.getByText('Select Customer');
      await user.click(selectCustomerBtn);

      await waitFor(() => {
        expect(screen.getByTestId('measurement-entry')).toBeInTheDocument();
      });

      // Add slab with very small dimensions
      const blockNumberInput = screen.getByTestId('block-number');
      const lengthInput = screen.getByTestId('length');
      const breadthInput = screen.getByTestId('breadth');
      const addSlabBtn = screen.getByText('Add Slab');

      await user.type(blockNumberInput, 'SMALL');
      await user.type(lengthInput, '2'); // Will become 0 after processing
      await user.type(breadthInput, '1'); // Will become 0 after processing
      await user.click(addSlabBtn);

      // Should handle gracefully with 0 square feet
      await waitFor(() => {
        expect(screen.getByTestId('slab-entry-0')).toHaveTextContent('SMALL - 0 sq ft');
      });
    });
  });

  describe('Data Persistence and State Management', () => {
    test('should maintain state throughout workflow', async () => {
      const user = userEvent.setup();
      render(<MockMeasurementSheetWorkflow />);

      // Complete workflow and verify state is maintained
      const retailRadio = screen.getByLabelText('Retail');
      await user.click(retailRadio);
      
      const selectCustomerBtn = screen.getByText('Select Customer');
      await user.click(selectCustomerBtn);

      await waitFor(() => {
        expect(screen.getByTestId('customer-info')).toHaveTextContent('Customer: Test Customer | Type: retail');
      });

      // Add multiple slabs and verify running totals
      const blockNumberInput = screen.getByTestId('block-number');
      const lengthInput = screen.getByTestId('length');
      const breadthInput = screen.getByTestId('breadth');
      const addSlabBtn = screen.getByText('Add Slab');

      // First slab
      await user.type(blockNumberInput, 'B001');
      await user.type(lengthInput, '72');
      await user.type(breadthInput, '72');
      await user.click(addSlabBtn);

      await waitFor(() => {
        expect(screen.getByTestId('total-square-feet')).toHaveTextContent('Total: 36.00 sq ft');
      });

      // Second slab
      await user.clear(blockNumberInput);
      await user.clear(lengthInput);
      await user.clear(breadthInput);
      
      await user.type(blockNumberInput, 'B002');
      await user.type(lengthInput, '72');
      await user.type(breadthInput, '72');
      await user.click(addSlabBtn);

      await waitFor(() => {
        expect(screen.getByTestId('total-square-feet')).toHaveTextContent('Total: 72.00 sq ft');
      });

      // Verify both entries are maintained
      expect(screen.getByTestId('slab-entry-0')).toBeInTheDocument();
      expect(screen.getByTestId('slab-entry-1')).toBeInTheDocument();
    });
  });

  describe('Customer Type Calculation Workflows', () => {
    const testCustomerTypeWorkflow = async (customerType, expectedCalculation) => {
      const user = userEvent.setup();
      render(<MockMeasurementSheetWorkflow />);

      // Select customer type based on the test
      const customerTypeRadio = screen.getByDisplayValue(customerType);
      await user.click(customerTypeRadio);
      
      const selectCustomerBtn = screen.getByText('Select Customer');
      await user.click(selectCustomerBtn);

      await waitFor(() => {
        expect(screen.getByTestId('measurement-entry')).toBeInTheDocument();
      });

      // Add test slab
      const blockNumberInput = screen.getByTestId('block-number');
      const lengthInput = screen.getByTestId('length');
      const breadthInput = screen.getByTestId('breadth');
      const addSlabBtn = screen.getByText('Add Slab');

      await user.type(blockNumberInput, 'TEST');
      await user.type(lengthInput, '150');
      await user.type(breadthInput, '100');
      await user.click(addSlabBtn);

      // Verify calculation matches expected result
      await waitFor(() => {
        expect(screen.getByTestId('slab-entry-0')).toHaveTextContent(`TEST - ${expectedCalculation} sq ft`);
      });
    };

    test('should handle all customer types correctly', async () => {
      // Test each customer type with the same dimensions
      const testCases = [
        { type: CUSTOMER_TYPES.RETAIL, expected: '104.17' }, // (150 * 100) / 144
        { type: CUSTOMER_TYPES.GRANITE_SHOPS, expected: '98.00' }, // ((147-3) * (98-2)) / 144 = (144 * 96) / 144
      ];

      for (const testCase of testCases) {
        await testCustomerTypeWorkflow(testCase.type, testCase.expected);
      }
    });
  });
});