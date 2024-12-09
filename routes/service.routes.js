const express = require('express');
const serviceRouter = express.Router();
const serviceController = require('../Controllers/service.controller');

// Routes pour les services
serviceRouter.post('/', serviceController.createService);
serviceRouter.get('/prestataire/:id', serviceController.getServicesByPrestataire);
serviceRouter.put('/:id', serviceController.updateService);
serviceRouter.delete('/:id', serviceController.deleteService);

module.exports = serviceRouter; 