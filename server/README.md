# Granite Measurement System - Backend

This is the backend API for the Granite Measurement System, built with Node.js, Express, PostgreSQL, and Redis.

## Features

- **High Performance**: PostgreSQL with connection pooling and Redis caching
- **Optimized Database**: Proper indexing on search fields for fast queries
- **CRUD Operations**: Complete API for customers, measurement sheets, and slab entries
- **Data Validation**: Comprehensive input validation and error handling
- **Response Compression**: Gzip compression for better performance
- **Caching**: Redis caching for frequently accessed data

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher) - Optional but recommended

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database
CREATE DATABASE granite_measurement;

# Create user (optional)
CREATE USER granite_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE granite_measurement TO granite_user;

# Exit psql
\q
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the database credentials:

```bash
cp .env.example .env
```

Update the following variables in `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=granite_measurement
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

### 3. Initialize Database Schema

Run the database setup script:

```bash
npm run db:setup
```

This will create all necessary tables, indexes, and triggers.

## Redis Setup (Optional)

Redis is used for caching and improves performance significantly:

### Install Redis

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

**Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

Update Redis configuration in `.env`:
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password  # Optional
```

## Running the Server

### Development Mode
```bash
npm run server
```

### Production Mode
```bash
npm run server:prod
```

### Full Development (Frontend + Backend)
```bash
npm run dev
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Customers
- `POST /api/customers` - Create customer
- `GET /api/customers` - List customers (with search and pagination)
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Measurement Sheets
- `POST /api/measurement-sheets` - Create measurement sheet
- `GET /api/measurement-sheets` - List measurement sheets (with filters)
- `GET /api/measurement-sheets/:id` - Get measurement sheet with slab entries
- `PUT /api/measurement-sheets/:id` - Update measurement sheet
- `DELETE /api/measurement-sheets/:id` - Delete measurement sheet

### Slab Entries
- `POST /api/slab-entries` - Create slab entry
- `POST /api/slab-entries/batch` - Batch create slab entries
- `GET /api/slab-entries/sheet/:measurementSheetId` - Get slab entries for sheet
- `GET /api/slab-entries/:id` - Get slab entry by ID
- `PUT /api/slab-entries/:id` - Update slab entry
- `DELETE /api/slab-entries/:id` - Delete slab entry

## Database Schema

### Tables Created:
- `customers` - Customer information
- `measurement_sheets` - Measurement sheet headers
- `slab_entries` - Individual slab measurements

### Key Features:
- **UUID Primary Keys** for better security and distribution
- **Automatic Sequential Numbering** for measurement sheets (MS-0001, MS-0002, etc.)
- **Optimized Indexes** on search fields (customer_id, measurement_sheet_number, created_at)
- **Automatic Triggers** for updating totals and timestamps
- **Data Validation** at database level with CHECK constraints

## Performance Optimizations

1. **Connection Pooling**: PostgreSQL connection pool with 20 max connections
2. **Database Indexing**: Indexes on frequently queried fields
3. **Redis Caching**: Caches customers, measurement sheets, and search results
4. **Response Compression**: Gzip compression for API responses
5. **Batch Operations**: Support for batch slab entry creation
6. **Pagination**: Efficient pagination for large datasets

## Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running: `sudo systemctl status postgresql`
2. Check database credentials in `.env` file
3. Verify database exists: `psql -U postgres -l`

### Redis Connection Issues
1. Check if Redis is running: `redis-cli ping`
2. Verify Redis configuration in `.env` file
3. Server will work without Redis but with reduced performance

### Performance Issues
1. Check database indexes: Run `EXPLAIN ANALYZE` on slow queries
2. Monitor Redis cache hit rates
3. Enable query logging in PostgreSQL for debugging

## Development

### Database Schema Changes
1. Update `server/database/schema.sql`
2. Run `npm run db:setup:force` to recreate schema
3. Test with sample data

### Adding New Endpoints
1. Create controller in `server/controllers/`
2. Add routes in `server/routes/`
3. Add validation middleware if needed
4. Update this README with new endpoints