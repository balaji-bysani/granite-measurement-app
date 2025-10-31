import React from 'react';
import { Form } from 'react-bootstrap';

const FormField = ({
  label,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  disabled = false,
  as = 'input',
  options = [],
  className = '',
  ...props
}) => {
  const hasError = touched && error;

  return (
    <Form.Group className={`mb-3 ${className}`}>
      {label && (
        <Form.Label>
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </Form.Label>
      )}
      
      {as === 'select' ? (
        <Form.Select
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          isInvalid={hasError}
          disabled={disabled}
          {...props}
        >
          <option value="">{placeholder || `Select ${label}`}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      ) : as === 'textarea' ? (
        <Form.Control
          as="textarea"
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          isInvalid={hasError}
          disabled={disabled}
          {...props}
        />
      ) : (
        <Form.Control
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          isInvalid={hasError}
          disabled={disabled}
          {...props}
        />
      )}
      
      {hasError && (
        <Form.Control.Feedback type="invalid">
          {error}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  );
};

export default FormField;