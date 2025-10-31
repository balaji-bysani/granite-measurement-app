import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form } from 'react-bootstrap';
import FormField from '../common/FormField';
import ErrorAlert from '../common/ErrorAlert';
import LoadingSpinner from '../common/LoadingSpinner';
import { SLAB_CATEGORIES } from '../../utils/constants';
import { calculationEngine } from '../../utils/calculationEngine';
import { validateSlabEntry } from '../../utils/validationHelpers';
import useErrorHandler from '../../hooks/useErrorHandler';

const SlabEntryForm = ({ 
  onAddEntry, 
  customerType, 
  nextSerialNumber,
  disabled = false 
}) => {
  const [formData, setFormData] = useState({
    blockNumber: '',
    length: '',
    breadth: '',
    slabCategory: ''
  });
  
  const [errors, setErrors] = useState({});
  const [calculation, setCalculation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: calculationError, setError: setCalculationError, clearError: clearCalculationError } = useErrorHandler();

  // Real-time calculation when length, breadth, or customer type changes
  useEffect(() => {
    const performCalculation = async () => {
      if (formData.length && formData.breadth && customerType) {
        const length = parseFloat(formData.length);
        const breadth = parseFloat(formData.breadth);
        
        if (length > 0 && breadth > 0) {
          setIsCalculating(true);
          clearCalculationError();
          
          try {
            // Add small delay to debounce rapid input changes
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const result = calculationEngine.calculateSquareFeet(length, breadth, customerType);
            setCalculation(result);
          } catch (error) {
            console.error('Calculation error:', error);
            setCalculation(null);
            
            // Only show calculation errors if they're validation errors
            if (error.type === 'validation') {
              setCalculationError(error);
            }
          } finally {
            setIsCalculating(false);
          }
        } else {
          setCalculation(null);
          clearCalculationError();
        }
      } else {
        setCalculation(null);
        clearCalculationError();
      }
    };

    const timeoutId = setTimeout(performCalculation, 100);
    return () => clearTimeout(timeoutId);
  }, [formData.length, formData.breadth, customerType, clearCalculationError, setCalculationError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const validation = validateSlabEntry(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting || disabled) {
      return;
    }
    
    setIsSubmitting(true);
    clearCalculationError();
    
    try {
      if (!validateForm()) {
        return;
      }
      
      if (!calculation) {
        setErrors({ general: 'Unable to calculate square footage. Please check your inputs and try again.' });
        return;
      }
      
      // Validate calculation result
      if (calculation.squareFeet <= 0) {
        setErrors({ general: 'Calculation resulted in zero or negative square footage. Please check your dimensions.' });
        return;
      }
      
      const slabEntry = {
        serialNumber: nextSerialNumber,
        blockNumber: formData.blockNumber.trim(),
        length: parseFloat(formData.length),
        breadth: parseFloat(formData.breadth),
        slabCategory: formData.slabCategory,
        finalLength: calculation.finalLength,
        finalBreadth: calculation.finalBreadth,
        squareFeet: calculation.squareFeet,
        calculationDetails: calculation.rawCalculation
      };
      
      // Call parent handler
      await onAddEntry(slabEntry);
      
      // Reset form on success
      setFormData({
        blockNumber: '',
        length: '',
        breadth: '',
        slabCategory: ''
      });
      setCalculation(null);
      setErrors({});
      
    } catch (error) {
      console.error('Error adding slab entry:', error);
      setErrors({ 
        general: error.message || 'Failed to add slab entry. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const slabCategoryOptions = SLAB_CATEGORIES.map(category => ({
    value: category,
    label: category
  }));

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">Add New Slab Entry</h5>
        <small className="text-muted">Serial Number: {nextSerialNumber}</small>
      </Card.Header>
      
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {errors.general && (
            <ErrorAlert 
              error={errors.general} 
              onDismiss={() => setErrors(prev => ({ ...prev, general: null }))}
              className="mb-3"
            />
          )}
          
          {calculationError && (
            <ErrorAlert 
              error={calculationError} 
              onDismiss={clearCalculationError}
              title="Calculation Error"
              className="mb-3"
            />
          )}
          
          <Row>
            <Col md={6}>
              <FormField
                label="Block Number"
                name="blockNumber"
                value={formData.blockNumber}
                onChange={handleInputChange}
                error={errors.blockNumber}
                touched={!!errors.blockNumber}
                placeholder="Enter block number"
                required
                disabled={disabled}
              />
            </Col>
            
            <Col md={3}>
              <FormField
                label="Length (inches)"
                name="length"
                type="number"
                step="0.01"
                min="0"
                value={formData.length}
                onChange={handleInputChange}
                error={errors.length}
                touched={!!errors.length}
                placeholder="0.00"
                required
                disabled={disabled}
              />
            </Col>
            
            <Col md={3}>
              <FormField
                label="Breadth (inches)"
                name="breadth"
                type="number"
                step="0.01"
                min="0"
                value={formData.breadth}
                onChange={handleInputChange}
                error={errors.breadth}
                touched={!!errors.breadth}
                placeholder="0.00"
                required
                disabled={disabled}
              />
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <FormField
                label="Slab Category"
                name="slabCategory"
                as="select"
                value={formData.slabCategory}
                onChange={handleInputChange}
                error={errors.slabCategory}
                touched={!!errors.slabCategory}
                options={slabCategoryOptions}
                placeholder="Select category"
                required
                disabled={disabled}
              />
            </Col>
            
            <Col md={6} className="d-flex align-items-end">
              <Button 
                type="submit" 
                variant="primary" 
                disabled={disabled || isCalculating || isSubmitting || !calculation || calculationError}
                className="w-100"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" inline className="me-2" />
                    Adding...
                  </>
                ) : isCalculating ? (
                  <>
                    <LoadingSpinner size="sm" inline className="me-2" />
                    Calculating...
                  </>
                ) : (
                  'Add Slab Entry'
                )}
              </Button>
            </Col>
          </Row>
        </Form>
        
        {/* Real-time calculation display */}
        {calculation && (
          <div className="mt-4 p-3 bg-light rounded">
            <h6 className="text-success mb-2">
              <i className="bi bi-calculator"></i> Calculation Preview
            </h6>
            
            <Row>
              <Col md={4}>
                <small className="text-muted">Original Dimensions:</small>
                <div>{formData.length}" × {formData.breadth}"</div>
              </Col>
              
              <Col md={4}>
                <small className="text-muted">Final Dimensions:</small>
                <div>{calculation.finalLength}" × {calculation.finalBreadth}"</div>
              </Col>
              
              <Col md={4}>
                <small className="text-muted">Square Feet:</small>
                <div className="fw-bold text-success fs-5">
                  {calculation.squareFeet} sq ft
                </div>
              </Col>
            </Row>
            
            <div className="mt-2">
              <small className="text-muted">Calculation:</small>
              <div className="font-monospace small">
                {calculation.rawCalculation}
              </div>
            </div>
            
            {calculation.calculationSteps && (
              <details className="mt-2">
                <summary className="text-muted small" style={{ cursor: 'pointer' }}>
                  View calculation steps
                </summary>
                <ul className="mt-2 mb-0 small">
                  {calculation.calculationSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default SlabEntryForm;