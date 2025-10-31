import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import components
import ErrorBoundary from './components/common/ErrorBoundary';
import Header from './components/common/Header';
import { AppProvider } from './contexts/AppContext';
import Dashboard from './pages/Dashboard';
import CustomerManagement from './pages/CustomerManagement';
import MeasurementSheetForm from './pages/MeasurementSheetForm';
import MeasurementSheetList from './pages/MeasurementSheetList';
import MeasurementSheetView from './pages/MeasurementSheetView';

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <div className="App">
            <Header />
            <main className="container-fluid">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/customers" element={<CustomerManagement />} />
                <Route path="/measurement-sheet/new" element={<MeasurementSheetForm />} />
                <Route path="/measurement-sheet/edit/:id" element={<MeasurementSheetForm />} />
                <Route path="/measurement-sheets" element={<MeasurementSheetList />} />
                <Route path="/measurement-sheet/:id" element={<MeasurementSheetView />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
