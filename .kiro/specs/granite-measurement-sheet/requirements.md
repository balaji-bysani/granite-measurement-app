# Requirements Document

## Introduction

A digital measurement sheet application designed for a granite slab manufacturing business to manage customer orders and calculate square footage based on different customer types. The system handles five distinct customer categories, each with specific measurement calculation rules, and provides automated slab entry with proper categorization.

## Glossary

- **Granite_Measurement_System**: The digital application for recording and managing granite slab measurements
- **Measurement_Sheet**: A digital form containing slab entries with dimensions, categories, and calculated square footage
- **Customer_Type**: One of five categories: Retail, Granite Shops (Wholesalers), Builders, Outstation Parties, or Exporters
- **Slab**: A granite piece with length, breadth, block number, and category classification
- **Slab_Category**: Classification of slab quality as "F", "LD", "D", or "S"
- **Final_Length**: Processed length measurement after applying customer-specific calculation rules
- **Final_Breadth**: Processed breadth measurement after applying customer-specific calculation rules
- **Square_Feet**: Calculated area using final length and breadth measurements
- **Customer_Details**: Stored information about customers including name, contact details, and address
- **Measurement_Sheet_Number**: Unique sequential identifier for each measurement sheet similar to a bill number

## Requirements

### Requirement 1

**User Story:** As a granite manufacturer, I want to select customer types before creating measurement sheets, so that the system applies the correct calculation method for each customer category.

#### Acceptance Criteria

1. THE Granite_Measurement_System SHALL provide a selection interface with five customer types: Retail, Granite Shops (Wholesalers), Builders, Outstation Parties, and Exporters
2. WHEN a user selects a customer type, THE Granite_Measurement_System SHALL store the selection and apply the corresponding calculation method
3. THE Granite_Measurement_System SHALL display the selected customer type prominently on the measurement sheet
4. WHEN creating a new measurement sheet, THE Granite_Measurement_System SHALL require customer type selection before proceeding
5. THE Granite_Measurement_System SHALL prevent changing customer type after slab entries are added to maintain calculation consistency

### Requirement 2

**User Story:** As a granite manufacturer, I want to enter slab measurements with automatic square footage calculation, so that I can efficiently process multiple slabs with accurate area calculations.

#### Acceptance Criteria

1. THE Granite_Measurement_System SHALL provide input fields for Serial No (auto-generated), Block No, Length (inches), Breadth (inches), and Slab Category
2. THE Granite_Measurement_System SHALL validate that length and breadth are positive numbers
3. THE Granite_Measurement_System SHALL provide a dropdown for Slab Category with options "F", "LD", "D", and "S"
4. WHEN slab dimensions are entered, THE Granite_Measurement_System SHALL automatically calculate and display square footage based on customer type
5. THE Granite_Measurement_System SHALL allow adding multiple slab entries to a single measurement sheet

### Requirement 3

**User Story:** As a granite manufacturer, I want the system to apply Retail calculation method, so that retail customers receive standard square footage calculations.

#### Acceptance Criteria

1. WHERE customer type is Retail, THE Granite_Measurement_System SHALL use entered length and breadth values directly
2. WHEN calculating for Retail customers, THE Granite_Measurement_System SHALL convert square inches to square feet by dividing by 144
3. THE Granite_Measurement_System SHALL display the calculation as (Length × Breadth) ÷ 144 for Retail customers
4. THE Granite_Measurement_System SHALL round the final square footage to two decimal places
5. THE Granite_Measurement_System SHALL show both the raw calculation and final square footage value

### Requirement 4

**User Story:** As a granite manufacturer, I want the system to apply Granite Shops calculation method, so that wholesale customers receive calculations with proper length and breadth adjustments.

#### Acceptance Criteria

1. WHERE customer type is Granite Shops, THE Granite_Measurement_System SHALL subtract 3 inches from length and process for divisibility by 3
2. WHEN processing length for Granite Shops, IF (length - 3) is divisible by 3, THE Granite_Measurement_System SHALL use (length - 3) as final length
3. WHEN processing length for Granite Shops, IF (length - 3) is not divisible by 3, THE Granite_Measurement_System SHALL subtract 1 more and check divisibility, repeating until divisible by 3
4. WHEN processing breadth for Granite Shops, THE Granite_Measurement_System SHALL subtract 2 from breadth and apply the same divisibility by 3 rule
5. THE Granite_Measurement_System SHALL calculate square footage using (final_length × final_breadth) ÷ 144

### Requirement 5

**User Story:** As a granite manufacturer, I want the system to apply Builders calculation method, so that builder customers receive calculations with length adjustment only.

#### Acceptance Criteria

1. WHERE customer type is Builders, THE Granite_Measurement_System SHALL subtract 3 inches from length and process for divisibility by 3
2. WHEN processing length for Builders, THE Granite_Measurement_System SHALL apply the same divisibility by 3 rule as Granite Shops
3. WHERE customer type is Builders, THE Granite_Measurement_System SHALL use the original breadth value without adjustment
4. THE Granite_Measurement_System SHALL calculate square footage using (final_length × breadth) ÷ 144
5. THE Granite_Measurement_System SHALL display both adjusted length and original breadth in the calculation

### Requirement 6

**User Story:** As a granite manufacturer, I want the system to apply Outstation Parties and Exporters calculation methods, so that these customer types receive their specific calculation adjustments.

#### Acceptance Criteria

1. WHERE customer type is Outstation Parties, THE Granite_Measurement_System SHALL apply the same calculation method as Granite Shops
2. WHERE customer type is Exporters, THE Granite_Measurement_System SHALL subtract 3 inches from length and 2 inches from breadth
3. WHEN calculating for Exporters, THE Granite_Measurement_System SHALL use (length - 3) and (breadth - 2) directly without divisibility checks
4. THE Granite_Measurement_System SHALL calculate square footage for Exporters using ((length - 3) × (breadth - 2)) ÷ 144
5. THE Granite_Measurement_System SHALL display the adjustment values clearly for each customer type

### Requirement 7

**User Story:** As a granite manufacturer, I want to capture and store customer details, so that I can easily retrieve customer information for repeat orders and maintain a customer database.

#### Acceptance Criteria

1. WHEN creating a new measurement sheet, THE Granite_Measurement_System SHALL provide fields for customer name, phone number, email, and address
2. THE Granite_Measurement_System SHALL store customer details in the database with a unique customer identifier
3. WHEN a returning customer places an order, THE Granite_Measurement_System SHALL allow searching and selecting existing customers
4. THE Granite_Measurement_System SHALL auto-populate customer details when an existing customer is selected
5. THE Granite_Measurement_System SHALL allow updating customer information and maintain the history of changes

### Requirement 8

**User Story:** As a granite manufacturer, I want each measurement sheet to have a unique sequential number, so that I can reference and track orders like bill numbers.

#### Acceptance Criteria

1. THE Granite_Measurement_System SHALL automatically generate a unique sequential measurement sheet number for each new sheet
2. THE Granite_Measurement_System SHALL display the measurement sheet number prominently at the top of each sheet
3. THE Granite_Measurement_System SHALL ensure measurement sheet numbers are never duplicated or reused
4. WHEN searching for measurement sheets, THE Granite_Measurement_System SHALL allow filtering by measurement sheet number
5. THE Granite_Measurement_System SHALL format the measurement sheet number with a consistent pattern (e.g., MS-0001, MS-0002)

### Requirement 9

**User Story:** As a granite manufacturer, I want to perform complete CRUD operations on measurement sheets, so that I can create, view, update, and delete measurement data as needed.

#### Acceptance Criteria

1. THE Granite_Measurement_System SHALL store all measurement sheets in a database with proper data persistence
2. THE Granite_Measurement_System SHALL allow creating new measurement sheets with all required fields
3. THE Granite_Measurement_System SHALL provide a view to display existing measurement sheets with search and filter capabilities
4. THE Granite_Measurement_System SHALL allow editing existing measurement sheets while maintaining data integrity
5. THE Granite_Measurement_System SHALL provide delete functionality with confirmation prompts to prevent accidental data loss

### Requirement 10

**User Story:** As a granite manufacturer, I want to view and manage completed measurement sheets, so that I can track orders and reference historical data.

#### Acceptance Criteria

1. THE Granite_Measurement_System SHALL display a list of all measurement sheets with measurement sheet number, customer name, customer type, date, and total square footage
2. WHEN viewing a measurement sheet, THE Granite_Measurement_System SHALL show customer details, all slab entries with individual and total calculations
3. THE Granite_Measurement_System SHALL allow searching measurement sheets by measurement sheet number, customer name, customer type, date range, or block number
4. THE Granite_Measurement_System SHALL provide export functionality for measurement sheets in PDF and CSV formats
5. THE Granite_Measurement_System SHALL maintain audit trails showing when measurement sheets were created, modified, or accessed