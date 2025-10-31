const express = require('express');
const router = express.Router();

// Import route modules
const customerRoutes = require('./customers');
const measurementSheetRoutes = require('./measurementSheets');
const slabEntryRoutes = require('./slabEntries');

// Mount routes
router.use('/customers', customerRoutes);
router.use('/measurement-sheets', measurementSheetRoutes);
router.use('/slab-entries', slabEntryRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Granite Measurement API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;