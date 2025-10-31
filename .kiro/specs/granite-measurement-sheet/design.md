# Design Document

## Overview

The Granite Measurement Sheet Application is a web-based system designed for granite slab manufacturing businesses to manage customer orders and calculate square footage based on different customer types. The application provides automated calculation engines for five distinct customer categories, comprehensive customer management, and full CRUD operations for measurement sheets with sequential numbering.

## Architecture

### System Architecture
The application follows a three-tier architecture:

1. **Presentation Layer**: Web-based user interface built with modern web technologies
2. **Business Logic Layer**: Application services handling customer types, calculation engines, and business rules
3. **Data Access Layer**: Database operations and data persistence

### Technology Stack
- **Frontend**: React.js with JavaScript (ES6+), CSS3, responsive design framework (Bootstrap or Material-UI)
- **Backend**: Node.js with Express.js framework
- **Database**: PostgreSQL for both development and production (with connection pooling)
- **Performance**: Redis for caching, database indexing, query optimization
- **Additional Libraries**: 
  - React Router for navigation
  - Axios for API calls with request/response interceptors
  - PDF generation library (jsPDF or PDFKit)
  - CSV export functionality
  - React-to-print for print functionality
  - Input validation library (Formik + Yup)
  - Redis for caching and session management
  - pg-pool for PostgreSQL connection pooling
  - Compression middleware for response optimization

## Components and Interfaces

### 1. Customer Management Component

**Purpose**: Handle customer registration, search, and selection

**Key Functions**:
- Customer registration with validation
- Customer search and selection
- Customer data persistence and retrieval

**Interface**:
```javascript
interface CustomerService {
  createCustomer(customerData: CustomerDetails): Promise<Customer>
  searchCustomers(searchTerm: string): Promise<Customer[]>
  getCustomerById(id: string): Promise<Customer>
  updateCustomer(id: string, customerData: CustomerDetails): Promise<Customer>
}
```

### 2. Calculation Engine Component

**Purpose**: Apply customer-specific calculation rules for square footage

**Key Functions**:
- Route calculations based on customer type
- Apply length and breadth adjustments
- Handle divisibility by 3 logic for wholesale customers
- Convert to square feet

**Calculation Methods**:

1. **Retail Calculator**: Direct calculation (L × B) ÷ 144
2. **Granite Shops Calculator**: Apply length-3 and breadth-2 with divisibility by 3
3. **Builders Calculator**: Apply length-3 with divisibility by 3, use original breadth
4. **Outstation Calculator**: Same as Granite Shops
5. **Exporters Calculator**: Simple (L-3) × (B-2) ÷ 144

**Interface**:
```javascript
interface CalculationEngine {
  calculateSquareFeet(length: number, breadth: number, customerType: CustomerType): CalculationResult
  processLength(length: number, customerType: CustomerType): number
  processBreadth(breadth: number, customerType: CustomerType): number
}
```

### 3. Measurement Sheet Management Component

**Purpose**: Handle CRUD operations for measurement sheets

**Key Functions**:
- Generate sequential measurement sheet numbers
- Create and manage measurement sheets
- Add/edit/delete slab entries
- Calculate totals and summaries

**Interface**:
```javascript
interface MeasurementSheetService {
  createMeasurementSheet(customerType: CustomerType, customerId: string): Promise<MeasurementSheet>
  addSlabEntry(sheetId: string, slabData: SlabEntry): Promise<SlabEntry>
  updateSlabEntry(entryId: string, slabData: SlabEntry): Promise<SlabEntry>
  getMeasurementSheet(sheetId: string): Promise<MeasurementSheet>
  searchMeasurementSheets(criteria: SearchCriteria): Promise<MeasurementSheet[]>
}
```

### 4. Export and Reporting Component

**Purpose**: Generate PDF, CSV exports and handle printing

**Key Functions**:
- PDF report generation with company branding
- CSV data export for spreadsheet integration
- Print-friendly formatting for direct printing
- Print preview functionality
- Customizable print layouts

**Interface**:
```javascript
interface ExportService {
  generatePDF(measurementSheet: MeasurementSheet): Promise<Blob>
  exportCSV(measurementSheet: MeasurementSheet): Promise<string>
  printMeasurementSheet(measurementSheet: MeasurementSheet): void
  getPrintPreview(measurementSheet: MeasurementSheet): React.Component
}
```

## Data Models

### Customer Model
```javascript
interface Customer {
  id: string
  name: string
  phoneNumber: string
  email?: string
  address: string
  createdAt: Date
  updatedAt: Date
}
```

### Measurement Sheet Model
```javascript
interface MeasurementSheet {
  id: string
  measurementSheetNumber: string  // MS-0001 format
  customerId: string
  customerType: CustomerType
  createdAt: Date
  updatedAt: Date
  slabEntries: SlabEntry[]
  totalSquareFeet: number
  status: 'draft' | 'completed'
}
```

### Slab Entry Model
```javascript
interface SlabEntry {
  id: string
  serialNumber: number  // Auto-generated within sheet
  blockNumber: string
  length: number  // in inches
  breadth: number  // in inches
  slabCategory: 'F' | 'LD' | 'D' | 'S'
  finalLength: number  // After customer-specific processing
  finalBreadth: number  // After customer-specific processing
  squareFeet: number  // Calculated result
  calculationDetails: string  // Human-readable calculation explanation
}
```

### Calculation Result Model
```javascript
interface CalculationResult {
  finalLength: number
  finalBreadth: number
  squareFeet: number
  calculationSteps: string[]
  rawCalculation: string
}
```

## User Interface Design

### React Component Structure
```
App
├── Header (Navigation, Logo)
├── Router
│   ├── Dashboard
│   ├── CustomerManagement
│   ├── MeasurementSheetForm
│   ├── MeasurementSheetList
│   └── MeasurementSheetView
└── Footer
```

### 1. Dashboard Component
- Quick access to create new measurement sheet
- Recent measurement sheets list with React table
- Search functionality with real-time filtering
- Customer management access
- Statistics cards (total sheets, customers, etc.)

### 2. Customer Selection/Registration Component
- Customer type selection (5 radio buttons with React state)
- Customer search with autocomplete using React hooks
- New customer registration form with Formik validation
- Customer details display with conditional rendering

### 3. Measurement Sheet Entry Component
- Header: Sheet number, customer info, customer type (React context)
- Dynamic slab entry form with React state management
- Real-time calculation display using useEffect hooks
- Running total of square footage with live updates
- Add/remove slab entries with React array manipulation
- Save and export options with loading states

### 4. Measurement Sheet List Component
- Filterable and sortable table using React table library
- Search by sheet number, customer name, date with debounced input
- Quick actions: view, edit, delete, export, print
- Pagination for large datasets using React pagination
- Bulk operations with checkbox selection

### 5. View/Edit Measurement Sheet Component
- Read-only view with edit toggle using React state
- Complete sheet details with responsive layout
- Individual slab calculations with expandable rows
- Export options (PDF, CSV) with download progress
- **Print functionality with print preview modal**
- **Print button with custom print styles**
- **Print-optimized layout component**

## Error Handling

### Input Validation
- Numeric validation for length and breadth (positive numbers only)
- Required field validation
- Customer type selection validation
- Slab category validation

### Calculation Error Handling
- Handle edge cases in divisibility calculations
- Validate calculation results
- Provide clear error messages for invalid inputs
- Graceful handling of calculation failures

### Database Error Handling
- Connection error recovery
- Transaction rollback on failures
- Data integrity validation
- Duplicate prevention for sheet numbers

### User Experience Error Handling
- Clear error messages with suggested actions
- Form validation feedback
- Loading states for async operations
- Confirmation dialogs for destructive actions

## Testing Strategy

### Unit Testing
- Calculation engine testing for all customer types
- Individual component testing
- Database operation testing
- Input validation testing

### Integration Testing
- End-to-end measurement sheet creation flow
- Customer management integration
- Export functionality testing
- Database integration testing

### User Acceptance Testing
- Real-world calculation scenarios
- Customer workflow testing
- Performance testing with large datasets
- Cross-browser compatibility testing

## Security Considerations

### Data Protection
- Input sanitization to prevent injection attacks
- Secure database connections
- Data backup and recovery procedures
- Access logging and audit trails

### Business Logic Security
- Calculation result validation
- Sequential number integrity
- Customer data privacy
- Measurement sheet data integrity

## Performance Considerations

### Database Optimization
- PostgreSQL with proper indexing on frequently queried fields (customer_id, measurement_sheet_number, created_at)
- Database connection pooling with pg-pool for high concurrency
- Query optimization with prepared statements and efficient joins
- Pagination with LIMIT/OFFSET optimization
- Redis caching for frequently accessed data (customer lists, recent sheets)
- Database partitioning for large measurement sheet tables
- Read replicas for high availability if needed

### Calculation Performance
- Efficient calculation algorithms
- Caching of frequently used calculations
- Batch processing for multiple slabs
- Real-time calculation updates

### User Interface Performance
- Responsive design for mobile devices using React responsive libraries
- Fast form validation with React hooks and debouncing
- Optimized loading times with React lazy loading and code splitting
- Progressive enhancement with React Suspense
- Virtual scrolling for large measurement sheet lists
- Memoization of calculation components to prevent unnecessary re-renders

## Print Functionality Design

### Print Component Architecture
- **PrintableSheet Component**: Dedicated component for print layout
- **Print Preview Modal**: Shows how the sheet will look when printed
- **Print Styles**: CSS media queries for print-specific styling
- **Print Button Integration**: Available in view and list screens

### Print Features
- **Direct Print**: Print measurement sheet directly from browser
- **Print Preview**: Modal showing exact print layout before printing
- **Custom Print Layout**: Optimized layout for A4 paper size
- **Company Branding**: Include company logo and details in print header
- **Print Options**: Choose what sections to include (customer details, calculations, totals)
- **Print-friendly Formatting**: Clean, professional appearance with proper spacing

### Print Implementation
```javascript
// Print Component Structure
const PrintableSheet = ({ measurementSheet, includeSections }) => {
  return (
    <div className="printable-sheet">
      <PrintHeader company={companyDetails} />
      <CustomerSection customer={measurementSheet.customer} />
      <SlabEntriesTable entries={measurementSheet.slabEntries} />
      <TotalsSection total={measurementSheet.totalSquareFeet} />
      <PrintFooter />
    </div>
  );
};

// Print CSS Media Query
@media print {
  .printable-sheet {
    font-size: 12px;
    color: black;
    background: white;
  }
  .no-print {
    display: none;
  }
}
```