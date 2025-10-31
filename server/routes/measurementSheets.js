const express = require('express');
const router = express.Router();
const {
  createMeasurementSheet,
  getMeasurementSheets,
  getMeasurementSheetById,
  updateMeasurementSheet,
  deleteMeasurementSheet,
  exportMeasurementSheetToPDF,
  exportMeasurementSheetToCSV
} = require('../controllers/measurementSheetController');
const {
  validateUUID,
  validateMeasurementSheetData,
  validatePagination
} = require('../middleware/validation');

// Measurement sheet routes
router.post('/', validateMeasurementSheetData, createMeasurementSheet);
router.get('/', validatePagination, getMeasurementSheets);
router.get('/:id', validateUUID('id'), getMeasurementSheetById);
router.put('/:id', validateUUID('id'), updateMeasurementSheet);
router.delete('/:id', validateUUID('id'), deleteMeasurementSheet);

// Export routes
router.get('/:id/export/pdf', validateUUID('id'), exportMeasurementSheetToPDF);
router.get('/:id/export/csv', validateUUID('id'), exportMeasurementSheetToCSV);

module.exports = router;