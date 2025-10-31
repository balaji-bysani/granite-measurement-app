const express = require('express');
const router = express.Router();
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getFrequentlyAccessedCustomers,
  getCustomerStatistics
} = require('../controllers/customerController');
const {
  validateUUID,
  validateCustomerData,
  validatePagination,
  validateCustomerSearch,
  validateLimit
} = require('../middleware/validation');

// Customer CRUD routes
router.post('/', validateCustomerData, createCustomer);
router.get('/', validatePagination, validateCustomerSearch, getCustomers);
router.get('/frequently-accessed', validateLimit, getFrequentlyAccessedCustomers);
router.get('/statistics', getCustomerStatistics);
router.get('/:id', validateUUID('id'), getCustomerById);
router.put('/:id', validateUUID('id'), validateCustomerData, updateCustomer);
router.delete('/:id', validateUUID('id'), deleteCustomer);

module.exports = router;