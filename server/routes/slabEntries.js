const express = require('express');
const router = express.Router();
const {
  createSlabEntry,
  getSlabEntries,
  getSlabEntryById,
  updateSlabEntry,
  deleteSlabEntry,
  batchCreateSlabEntries
} = require('../controllers/slabEntryController');
const {
  validateUUID,
  validateSlabEntryData
} = require('../middleware/validation');

// Slab entry routes
router.post('/', validateSlabEntryData, createSlabEntry);
router.post('/batch', batchCreateSlabEntries);
router.get('/sheet/:measurementSheetId', validateUUID('measurementSheetId'), getSlabEntries);
router.get('/:id', validateUUID('id'), getSlabEntryById);
router.put('/:id', validateUUID('id'), updateSlabEntry);
router.delete('/:id', validateUUID('id'), deleteSlabEntry);

module.exports = router;