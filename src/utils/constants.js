// Application constants
export const CUSTOMER_TYPES = {
  RETAIL: 'retail',
  GRANITE_SHOPS: 'granite_shops',
  BUILDERS: 'builders',
  OUTSTATION_PARTIES: 'outstation_parties',
  EXPORTERS: 'exporters'
};

export const CUSTOMER_TYPE_LABELS = {
  retail: 'Retail',
  granite_shops: 'Granite Shops (Wholesalers)',
  builders: 'Builders',
  outstation_parties: 'Outstation Parties',
  exporters: 'Exporters'
};

export const SLAB_CATEGORIES = ['F', 'LD', 'D', 'S'];

export const MEASUREMENT_SHEET_STATUS = {
  DRAFT: 'draft',
  COMPLETED: 'completed'
};

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  CUSTOMERS: '/customers',
  MEASUREMENT_SHEETS: '/measurement-sheets',
  SLAB_ENTRIES: '/slab-entries'
};

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/',
  CUSTOMERS: '/customers',
  NEW_MEASUREMENT_SHEET: '/measurement-sheet/new',
  EDIT_MEASUREMENT_SHEET: '/measurement-sheet/edit',
  MEASUREMENT_SHEETS: '/measurement-sheets',
  VIEW_MEASUREMENT_SHEET: '/measurement-sheet'
};

export const FORM_VALIDATION = {
  REQUIRED_MESSAGE: 'This field is required',
  POSITIVE_NUMBER_MESSAGE: 'Must be a positive number',
  EMAIL_MESSAGE: 'Please enter a valid email address',
  PHONE_MESSAGE: 'Please enter a valid phone number'
};