import React, { useState } from 'react';
import { Formik, Form as FormikForm, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { customerService } from '../../services/customerService';

const CustomerRegistrationForm = ({ onCustomerCreated, onCancel, disabled = false }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Validation schema using Yup
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Customer name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters')
      .trim(),
    phoneNumber: Yup.string()
      .required('Phone number is required')
      .matches(/^[0-9+\-\s()]+$/, 'Please enter a valid phone number')
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number must be less than 15 digits'),
    email: Yup.string()
      .email('Please enter a valid email address')
      .max(100, 'Email must be less than 100 characters')
      .nullable(),
    address: Yup.string()
      .required('Address is required')
      .min(5, 'Address must be at least 5 characters')
      .max(500, 'Address must be less than 500 characters')
      .trim()
  });

  const initialValues = {
    name: '',
    phoneNumber: '',
    email: '',
    address: ''
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const newCustomer = await customerService.createCustomer(values);
      setSubmitSuccess('Customer created successfully!');
      resetForm();
      
      // Notify parent component
      if (onCustomerCreated) {
        onCustomerCreated(newCustomer);
      }
    } catch (error) {
      if (error.response?.status === 409) {
        setSubmitError('A customer with this phone number already exists.');
      } else if (error.response?.data?.details) {
        setSubmitError(`Validation error: ${error.response.data.details.join(', ')}`);
      } else {
        setSubmitError('Failed to create customer. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  return (
    <Card className="mb-3">
      <Card.Header>
        <h5 className="mb-0">Register New Customer</h5>
        <small className="text-muted">Add a new customer to the system</small>
      </Card.Header>
      <Card.Body>
        {submitError && (
          <Alert variant="danger" dismissible onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        {submitSuccess && (
          <Alert variant="success" dismissible onClose={() => setSubmitSuccess(null)}>
            {submitSuccess}
          </Alert>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting: formikSubmitting, errors, touched }) => (
            <FormikForm>
              <Form.Group className="mb-3">
                <Form.Label>Customer Name *</Form.Label>
                <Field
                  as={Form.Control}
                  type="text"
                  name="name"
                  placeholder="Enter customer name"
                  disabled={disabled || isSubmitting}
                  isInvalid={errors.name && touched.name}
                />
                <ErrorMessage name="name" component={Form.Control.Feedback} type="invalid" />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Phone Number *</Form.Label>
                <Field
                  as={Form.Control}
                  type="tel"
                  name="phoneNumber"
                  placeholder="Enter phone number"
                  disabled={disabled || isSubmitting}
                  isInvalid={errors.phoneNumber && touched.phoneNumber}
                />
                <ErrorMessage name="phoneNumber" component={Form.Control.Feedback} type="invalid" />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Field
                  as={Form.Control}
                  type="email"
                  name="email"
                  placeholder="Enter email address (optional)"
                  disabled={disabled || isSubmitting}
                  isInvalid={errors.email && touched.email}
                />
                <ErrorMessage name="email" component={Form.Control.Feedback} type="invalid" />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Address *</Form.Label>
                <Field
                  as="textarea"
                  className="form-control"
                  rows={3}
                  name="address"
                  placeholder="Enter customer address"
                  disabled={disabled || isSubmitting}
                  style={{
                    borderColor: errors.address && touched.address ? '#dc3545' : undefined
                  }}
                />
                <ErrorMessage name="address" component={Form.Control.Feedback} type="invalid" />
              </Form.Group>

              <div className="d-flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={disabled || isSubmitting || formikSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Customer'
                  )}
                </Button>

                {onCancel && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </FormikForm>
          )}
        </Formik>
      </Card.Body>
    </Card>
  );
};

export default CustomerRegistrationForm;