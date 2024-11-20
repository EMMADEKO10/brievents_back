const express = require('express');
const router = express.Router();
const filterController = require('../controllers/filterController');

router.get('/', filterController.getFilterCategories);

module.exports = router; 