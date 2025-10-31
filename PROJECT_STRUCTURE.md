# Project Structure

## Frontend (React.js)
```
src/
├── components/           # React components
│   ├── common/          # Reusable UI components
│   ├── customer/        # Customer management components
│   ├── measurement-sheet/ # Measurement sheet components
│   └── print/           # Print-related components
├── contexts/            # React contexts for state management
├── hooks/               # Custom React hooks
├── pages/               # Page-level components
├── services/            # API service functions
└── utils/               # Utility functions and constants
```

## Backend (Node.js/Express)
```
server/
├── config/              # Database and Redis configuration
├── controllers/         # Route controllers
├── middleware/          # Express middleware
├── models/              # Data models
└── routes/              # API routes
```

## Key Dependencies
- **Frontend**: React, React Router, Axios, Bootstrap, Formik, Yup
- **Backend**: Express, PostgreSQL (pg-pool), Redis, Compression
- **Development**: Nodemon, Concurrently
- **Export/Print**: jsPDF, react-to-print

## Available Scripts
- `npm start` - Start React development server
- `npm run server` - Start backend server with nodemon
- `npm run dev` - Start both frontend and backend concurrently
- `npm run build` - Build React app for production
- `npm test` - Run tests