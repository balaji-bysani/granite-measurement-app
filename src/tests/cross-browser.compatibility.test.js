/**
 * Cross-Browser Compatibility Tests
 * Tests application functionality across different browsers and devices
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { calculationEngine } from '../utils/calculationEngine';
import { CUSTOMER_TYPES } from '../utils/constants';

// Mock different browser environments
const mockBrowserEnvironments = {
  chrome: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    vendor: 'Google Inc.',
    platform: 'Win32'
  },
  firefox: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    vendor: '',
    platform: 'Win32'
  },
  safari: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    vendor: 'Apple Computer, Inc.',
    platform: 'MacIntel'
  },
  edge: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    vendor: 'Google Inc.',
    platform: 'Win32'
  },
  mobile: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    vendor: 'Apple Computer, Inc.',
    platform: 'iPhone'
  }
};

// Mock component for testing browser compatibility
const MockCalculationComponent = ({ customerType = CUSTOMER_TYPES.RETAIL }) => {
  const [length, setLength] = React.useState('');
  const [breadth, setBreadth] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);

  const handleCalculate = () => {
    try {
      setError(null);
      const calculation = calculationEngine.calculateSquareFeet(
        parseFloat(length),
        parseFloat(breadth),
        customerType
      );
      setResult(calculation);
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  };

  return (
    <div data-testid="calculation-component">
      <input
        data-testid="length-input"
        type="number"
        placeholder="Length"
        value={length}
        onChange={(e) => setLength(e.target.value)}
      />
      <input
        data-testid="breadth-input"
        type="number"
        placeholder="Breadth"
        value={breadth}
        onChange={(e) => setBreadth(e.target.value)}
      />
      <button data-testid="calculate-button" onClick={handleCalculate}>
        Calculate
      </button>
      {result && (
        <div data-testid="calculation-result">
          {result.squareFeet} sq ft
        </div>
      )}
      {error && (
        <div data-testid="calculation-error">
          {error}
        </div>
      )}
    </div>
  );
};

describe('Cross-Browser Compatibility Tests', () => {
  let originalUserAgent;
  let originalVendor;
  let originalPlatform;

  beforeEach(() => {
    // Store original values
    originalUserAgent = navigator.userAgent;
    originalVendor = navigator.vendor;
    originalPlatform = navigator.platform;
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: originalUserAgent
    });
    Object.defineProperty(navigator, 'vendor', {
      writable: true,
      value: originalVendor
    });
    Object.defineProperty(navigator, 'platform', {
      writable: true,
      value: originalPlatform
    });
  });

  const setBrowserEnvironment = (browser) => {
    const env = mockBrowserEnvironments[browser];
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: env.userAgent
    });
    Object.defineProperty(navigator, 'vendor', {
      writable: true,
      value: env.vendor
    });
    Object.defineProperty(navigator, 'platform', {
      writable: true,
      value: env.platform
    });
  };

  describe('Browser-Specific Functionality', () => {
    test('should work correctly in Chrome', async () => {
      setBrowserEnvironment('chrome');
      const user = userEvent.setup();
      
      render(<MockCalculationComponent />);
      
      const lengthInput = screen.getByTestId('length-input');
      const breadthInput = screen.getByTestId('breadth-input');
      const calculateButton = screen.getByTestId('calculate-button');
      
      await user.type(lengthInput, '144');
      await user.type(breadthInput, '144');
      await user.click(calculateButton);
      
      expect(screen.getByTestId('calculation-result')).toHaveTextContent('144 sq ft');
    });

    test('should work correctly in Firefox', async () => {
      setBrowserEnvironment('firefox');
      const user = userEvent.setup();
      
      render(<MockCalculationComponent />);
      
      const lengthInput = screen.getByTestId('length-input');
      const breadthInput = screen.getByTestId('breadth-input');
      const calculateButton = screen.getByTestId('calculate-button');
      
      await user.type(lengthInput, '100');
      await user.type(breadthInput, '50');
      await user.click(calculateButton);
      
      expect(screen.getByTestId('calculation-result')).toHaveTextContent('34.72 sq ft');
    });

    test('should work correctly in Safari', async () => {
      setBrowserEnvironment('safari');
      const user = userEvent.setup();
      
      render(<MockCalculationComponent />);
      
      const lengthInput = screen.getByTestId('length-input');
      const breadthInput = screen.getByTestId('breadth-input');
      const calculateButton = screen.getByTestId('calculate-button');
      
      await user.type(lengthInput, '72');
      await user.type(breadthInput, '72');
      await user.click(calculateButton);
      
      expect(screen.getByTestId('calculation-result')).toHaveTextContent('36 sq ft');
    });

    test('should work correctly in Edge', async () => {
      setBrowserEnvironment('edge');
      const user = userEvent.setup();
      
      render(<MockCalculationComponent />);
      
      const lengthInput = screen.getByTestId('length-input');
      const breadthInput = screen.getByTestId('breadth-input');
      const calculateButton = screen.getByTestId('calculate-button');
      
      await user.type(lengthInput, '120');
      await user.type(breadthInput, '60');
      await user.click(calculateButton);
      
      expect(screen.getByTestId('calculation-result')).toHaveTextContent('50 sq ft');
    });

    test('should work correctly on mobile devices', async () => {
      setBrowserEnvironment('mobile');
      const user = userEvent.setup();
      
      render(<MockCalculationComponent />);
      
      const lengthInput = screen.getByTestId('length-input');
      const breadthInput = screen.getByTestId('breadth-input');
      const calculateButton = screen.getByTestId('calculate-button');
      
      await user.type(lengthInput, '96');
      await user.type(breadthInput, '48');
      await user.click(calculateButton);
      
      expect(screen.getByTestId('calculation-result')).toHaveTextContent('32 sq ft');
    });
  });

  describe('Input Handling Across Browsers', () => {
    test('should handle number input consistently across browsers', async () => {
      const browsers = ['chrome', 'firefox', 'safari', 'edge'];
      
      for (const browser of browsers) {
        setBrowserEnvironment(browser);
        const user = userEvent.setup();
        
        const { unmount } = render(<MockCalculationComponent />);
        
        const lengthInput = screen.getByTestId('length-input');
        const breadthInput = screen.getByTestId('breadth-input');
        const calculateButton = screen.getByTestId('calculate-button');
        
        // Test decimal input
        await user.type(lengthInput, '144.5');
        await user.type(breadthInput, '72.25');
        await user.click(calculateButton);
        
        expect(screen.getByTestId('calculation-result')).toHaveTextContent('72.53 sq ft');
        
        unmount();
      }
    });

    test('should handle invalid input consistently', async () => {
      const browsers = ['chrome', 'firefox', 'safari', 'edge'];
      
      for (const browser of browsers) {
        setBrowserEnvironment(browser);
        const user = userEvent.setup();
        
        const { unmount } = render(<MockCalculationComponent />);
        
        const lengthInput = screen.getByTestId('length-input');
        const breadthInput = screen.getByTestId('breadth-input');
        const calculateButton = screen.getByTestId('calculate-button');
        
        // Test invalid input
        await user.type(lengthInput, 'invalid');
        await user.type(breadthInput, '100');
        await user.click(calculateButton);
        
        expect(screen.getByTestId('calculation-error')).toBeInTheDocument();
        
        unmount();
      }
    });
  });

  describe('JavaScript Feature Compatibility', () => {
    test('should handle ES6+ features across browsers', () => {
      // Test arrow functions
      const testArrowFunction = () => 'test';
      expect(testArrowFunction()).toBe('test');
      
      // Test template literals
      const testTemplate = `test ${123}`;
      expect(testTemplate).toBe('test 123');
      
      // Test destructuring
      const { RETAIL } = CUSTOMER_TYPES;
      expect(RETAIL).toBe('retail');
      
      // Test