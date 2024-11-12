const express = require('express');
const organizerRouter = express.Router();
const organizerController = require('../Controllers/organizer.controller');

// Route pour la création d'un organizer en attente
organizerRouter.post('/register', organizerController.createPendingOrganizer);
// Route pour la confirmation de l'inscription du organizer
organizerRouter.get('/confirm/:token', organizerController.confirmOrganizer);

module.exports = organizerRouter;
