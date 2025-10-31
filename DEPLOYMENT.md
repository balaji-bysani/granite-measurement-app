# Deployment Guide: Vercel + Supabase

## 📋 Prerequisites
- GitHub account
- Vercel account (free)
- Supabase account (free)

## 🗄️ Step 1: Set up Supabase Database

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Choose organization and enter:
   - **Name**: `granite-measurement-db`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for setup to complete (~2 minutes)

### 1.2 Get Database Connection Details
1. In your Supabase dashboard, go to **Settings** → **Database**
2. Copy the connection details:
   - **Host**: `db.tdrlwskgkifkvrszrjhm.supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: `Ijalab23@`

### 1.3 Set up Database Tables
1. Go to **SQL Editor** in Supabase
2. Run this SQL to create tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create measurement_sheets table
CREATE TABLE measurement_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measurement_sheet_number VARCHAR(50) UNIQUE NOT NULL DEFAULT 'MS-' || LPAD(nextval('measurement_sheet_seq')::text, 4, '0'),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_type VARCHAR(50) NOT NULL,
    total_square_feet DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sequence for measurement sheet numbers
CREATE SEQUENCE measurement_sheet_seq START 1;

-- Create slab_entries table
CREATE TABLE slab_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measurement_sheet_id UUID NOT NULL REFERENCES measurement_sheets(id) ON DELETE CASCADE,
    serial_number INTEGER NOT NULL,
    block_number VARCHAR(100) NOT NULL,
    length DECIMAL(8,2) NOT NULL,
    breadth DECIMAL(8,2) NOT NULL,
    slab_category VARCHAR(10) NOT NULL,
    final_length DECIMAL(8,2) NOT NULL,
    final_breadth DECIMAL(8,2) NOT NULL,
    square_feet DECIMAL(10,2) NOT NULL,
    calculation_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_customers_phone ON customers(phone_number);
CREATE INDEX idx_measurement_sheets_customer ON measurement_sheets(customer_id);
CREATE INDEX idx_measurement_sheets_number ON measurement_sheets(measurement_sheet_number);
CREATE INDEX idx_slab_entries_sheet ON slab_entries(measurement_sheet_id);
```

## 🚀 Step 2: Deploy to Vercel

### 2.1 Push Code to GitHub
1. Initialize git repository (if not already done):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create GitHub repository:
   - Go to [github.com](https://github.com)
   - Click "New repository"
   - Name: `granite-measurement-app`
   - Make it public (for free hosting)
   - Don't initialize with README (we already have files)

3. Push to GitHub:
```bash
git remote add origin https://github.com/YOUR_USERNAME/granite-measurement-app.git
git branch -M main
git push -u origin main
```

### 2.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your `granite-measurement-app` repository
5. Configure project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `build`

### 2.3 Set Environment Variables in Vercel
1. In Vercel dashboard, go to your project
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

```
NODE_ENV = production
DB_HOST = [Your Supabase host from step 1.2]
DB_PORT = 5432
DB_NAME = postgres
DB_USER = postgres
DB_PASSWORD = [Your Supabase password]
DATABASE_URL = postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
REACT_APP_API_URL = https://[your-vercel-app-name].vercel.app/api
```

4. Click "Deploy" to redeploy with new environment variables

## ✅ Step 3: Test Your Deployment

1. Visit your Vercel app URL (shown in dashboard)
2. Test creating a customer
3. Test creating measurement sheets
4. Test calculations

## 🔧 Troubleshooting

### Common Issues:
1. **Database connection fails**: Check Supabase connection details
2. **API routes not working**: Ensure vercel.json is configured correctly
3. **Build fails**: Check that all dependencies are in package.json

### Logs:
- **Vercel Function Logs**: Vercel Dashboard → Functions → View Logs
- **Build Logs**: Vercel Dashboard → Deployments → Click deployment

## 🔄 Making Updates

1. Make changes to your code
2. Push to GitHub:
```bash
git add .
git commit -m "Your update message"
git push
```
3. Vercel will automatically redeploy

## 💡 Tips

- Use Vercel's preview deployments for testing
- Monitor usage in both Vercel and Supabase dashboards
- Set up custom domain in Vercel settings (optional)
- Enable Supabase Row Level Security for production use