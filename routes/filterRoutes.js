const express = require('express');
const router = express.Router();
const filterController = require('../controllers/filterController');

router.get('/', filterController.getFilterCategories);

router.post('/location', filterController.createLocation);
router.post('/eventType', filterController.createEventType);
router.post('/theme', filterController.createTheme);

module.exports = router; 