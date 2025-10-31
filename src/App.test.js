import { render, screen } from '@testing-library/react';
import CustomButton from './components/common/CustomButton';
import LoadingSpinner from './components/common/LoadingSpinner';

test('renders custom button', () => {
  render(<CustomButton>Test Button</CustomButton>);
  const buttonElement = screen.getByText(/Test Button/i);
  expect(buttonElement).toBeInTheDocument();
});

test('renders loading spinner', () => {
  render(<LoadingSpinner text="Loading test..." />);
  const loadingElement = screen.getByText(/Loading test.../i);
  expect(loadingElement).toBeInTheDocument();
});
