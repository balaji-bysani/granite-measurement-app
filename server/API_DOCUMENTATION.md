# Customer Management API Documentation

## Overview
High-performance customer management system with PostgreSQL optimization, Redis caching, and advanced search capabilities.

## Base URL
```
http://localhost:5000/api/customers
```

## Endpoints

### 1. Create Customer
**POST** `/`

Creates a new customer with validation and duplicate checking.

**Request Body:**
```json
{
  "name": "John Doe",
  "phoneNumber": "1234567890",
  "email": "john@example.com",
  "address": "123 Main St, City, State"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "phoneNumber": "1234567890",
    "email": "john@example.com",
    "address": "123 Main St, City, State",
    "createdAt": "2023-10-31T10:00:00Z",
    "updatedAt": "2023-10-31T10:00:00Z"
  },
  "message": "Customer created successfully"
}
```

### 2. Get Customers with Search
**GET** `/`

Retrieves customers with advanced search, pagination, and sorting.

**Query Parameters:**
- `search` (optional): Search term for name, phone, or email
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `sortBy` (optional): Sort field (name, phone_number, email, created_at, updated_at)
- `sortOrder` (optional): Sort order (ASC, DESC)

**Example:**
```
GET /api/customers?search=john&page=1&limit=10&sortBy=name&sortOrder=ASC
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phoneNumber": "1234567890",
      "email": "john@example.com",
      "address": "123 Main St",
      "createdAt": "2023-10-31T10:00:00Z",
      "updatedAt": "2023-10-31T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  },
  "searchTerm": "john"
}
```

### 3. Get Customer by ID
**GET** `/:id`

Retrieves a specific customer by ID with caching.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "phoneNumber": "1234567890",
    "email": "john@example.com",
    "address": "123 Main St",
    "createdAt": "2023-10-31T10:00:00Z",
    "updatedAt": "2023-10-31T10:00:00Z"
  }
}
```

### 4. Update Customer
**PUT** `/:id`

Updates an existing customer with validation and duplicate checking.

**Request Body:**
```json
{
  "name": "John Smith",
  "phoneNumber": "1234567890",
  "email": "johnsmith@example.com",
  "address": "456 Oak Ave, City, State"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Smith",
    "phoneNumber": "1234567890",
    "email": "johnsmith@example.com",
    "address": "456 Oak Ave, City, State",
    "createdAt": "2023-10-31T10:00:00Z",
    "updatedAt": "2023-10-31T10:30:00Z"
  },
  "message": "Customer updated successfully"
}
```

### 5. Delete Customer
**DELETE** `/:id`

Deletes a customer (only if no measurement sheets exist).

**Response:**
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

### 6. Get Frequently Accessed Customers
**GET** `/frequently-accessed`

Retrieves customers ordered by usage frequency (based on measurement sheets).

**Query Parameters:**
- `limit` (optional): Number of customers to return (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phoneNumber": "1234567890",
      "email": "john@example.com",
      "address": "123 Main St",
      "createdAt": "2023-10-31T10:00:00Z",
      "updatedAt": "2023-10-31T10:00:00Z"
    }
  ],
  "message": "Top 10 frequently accessed customers"
}
```

### 7. Get Customer Statistics
**GET** `/statistics`

Retrieves customer statistics and metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCustomers": 150,
    "newCustomersToday": 5,
    "newCustomersThisWeek": 23,
    "activeCustomers": 89
  },
  "message": "Customer statistics retrieved successfully"
}
```

## Performance Features

### 1. Database Optimization
- **Indexes**: Full-text search index on customer names using GIN
- **Connection Pooling**: PostgreSQL connection pool with 20 max connections
- **Prepared Statements**: All queries use prepared statements for better performance
- **Parallel Queries**: Count and data queries executed in parallel

### 2. Caching Strategy
- **Individual Customers**: Cached for 1 hour
- **Search Results**: Cached for 5 minutes
- **Frequently Accessed**: Cached for 30 minutes
- **Statistics**: Cached for 15 minutes
- **Cache Invalidation**: Automatic cache clearing on data changes

### 3. Search Optimization
- **Full-text Search**: PostgreSQL GIN index for name searches
- **ILIKE Patterns**: Optimized pattern matching for phone/email
- **Debounced Results**: Frontend should implement debouncing for search inputs

### 4. Validation & Error Handling
- **Input Validation**: Comprehensive validation with detailed error messages
- **Duplicate Prevention**: Phone number uniqueness checking
- **Business Rules**: Cannot delete customers with measurement sheets
- **Error Responses**: Consistent error format with development/production modes

## Error Responses

### Validation Error (400)
```json
{
  "error": "Validation failed",
  "details": [
    "Name is required and must be a non-empty string",
    "Phone number is required and must be a non-empty string"
  ]
}
```

### Duplicate Customer (409)
```json
{
  "error": "Customer with this phone number already exists",
  "existingCustomer": {
    "id": "uuid",
    "name": "Existing Customer",
    "phoneNumber": "1234567890"
  }
}
```

### Customer Not Found (404)
```json
{
  "error": "Customer not found",
  "message": "No customer found with ID: uuid"
}
```

### Cannot Delete (409)
```json
{
  "error": "Cannot delete customer",
  "message": "Customer has existing measurement sheets and cannot be deleted"
}
```

## Usage Examples

### Creating a Customer
```javascript
const response = await fetch('/api/customers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    phoneNumber: '1234567890',
    email: 'john@example.com',
    address: '123 Main St'
  })
});

const result = await response.json();
```

### Searching Customers
```javascript
const searchParams = new URLSearchParams({
  search: 'john',
  page: '1',
  limit: '10',
  sortBy: 'name',
  sortOrder: 'ASC'
});

const response = await fetch(`/api/customers?${searchParams}`);
const result = await response.json();
```

### Getting Frequently Accessed Customers
```javascript
const response = await fetch('/api/customers/frequently-accessed?limit=5');
const result = await response.json();
```