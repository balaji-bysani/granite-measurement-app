import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
  user: null,
  loading: false,
  error: null,
  customers: [],
  measurementSheets: [],
  currentSheet: null,
};

// Action types
export const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_USER: 'SET_USER',
  SET_CUSTOMERS: 'SET_CUSTOMERS',
  ADD_CUSTOMER: 'ADD_CUSTOMER',
  UPDATE_CUSTOMER: 'UPDATE_CUSTOMER',
  SET_MEASUREMENT_SHEETS: 'SET_MEASUREMENT_SHEETS',
  ADD_MEASUREMENT_SHEET: 'ADD_MEASUREMENT_SHEET',
  UPDATE_MEASUREMENT_SHEET: 'UPDATE_MEASUREMENT_SHEET',
  DELETE_MEASUREMENT_SHEET: 'DELETE_MEASUREMENT_SHEET',
  SET_CURRENT_SHEET: 'SET_CURRENT_SHEET',
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    case ActionTypes.SET_USER:
      return { ...state, user: action.payload };
    
    case ActionTypes.SET_CUSTOMERS:
      return { ...state, customers: action.payload };
    
    case ActionTypes.ADD_CUSTOMER:
      return { 
        ...state, 
        customers: [...state.customers, action.payload] 
      };
    
    case ActionTypes.UPDATE_CUSTOMER:
      return {
        ...state,
        customers: state.customers.map(customer =>
          customer.id === action.payload.id ? action.payload : customer
        )
      };
    
    case ActionTypes.SET_MEASUREMENT_SHEETS:
      return { ...state, measurementSheets: action.payload };
    
    case ActionTypes.ADD_MEASUREMENT_SHEET:
      return {
        ...state,
        measurementSheets: [...state.measurementSheets, action.payload]
      };
    
    case ActionTypes.UPDATE_MEASUREMENT_SHEET:
      return {
        ...state,
        measurementSheets: state.measurementSheets.map(sheet =>
          sheet.id === action.payload.id ? action.payload : sheet
        )
      };
    
    case ActionTypes.DELETE_MEASUREMENT_SHEET:
      return {
        ...state,
        measurementSheets: state.measurementSheets.filter(
          sheet => sheet.id !== action.payload
        )
      };
    
    case ActionTypes.SET_CURRENT_SHEET:
      return { ...state, currentSheet: action.payload };
    
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Context provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Action creators
  const actions = {
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),
    setUser: (user) => dispatch({ type: ActionTypes.SET_USER, payload: user }),
    setCustomers: (customers) => dispatch({ type: ActionTypes.SET_CUSTOMERS, payload: customers }),
    addCustomer: (customer) => dispatch({ type: ActionTypes.ADD_CUSTOMER, payload: customer }),
    updateCustomer: (customer) => dispatch({ type: ActionTypes.UPDATE_CUSTOMER, payload: customer }),
    setMeasurementSheets: (sheets) => dispatch({ type: ActionTypes.SET_MEASUREMENT_SHEETS, payload: sheets }),
    addMeasurementSheet: (sheet) => dispatch({ type: ActionTypes.ADD_MEASUREMENT_SHEET, payload: sheet }),
    updateMeasurementSheet: (sheet) => dispatch({ type: ActionTypes.UPDATE_MEASUREMENT_SHEET, payload: sheet }),
    deleteMeasurementSheet: (id) => dispatch({ type: ActionTypes.DELETE_MEASUREMENT_SHEET, payload: id }),
    setCurrentSheet: (sheet) => dispatch({ type: ActionTypes.SET_CURRENT_SHEET, payload: sheet }),
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;