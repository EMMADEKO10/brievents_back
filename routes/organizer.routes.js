const express = require('express');
const organizerRouter = express.Router();
const organizerController = require('../Controllers/organizer.controller');

// Route pour la création d'un organizer en attente
organizerRouter.post('/register', organizerController.createPendingOrganizer);
// Route pour la confirmation de l'inscription du organizer
organizerRouter.get('/confirm/:token', organizerController.confirmOrganizer);
// Route pour la récupération des données du dashboard
organizerRouter.get('/dashboard/:userId', organizerController.getDashboardData);

// Route pour récupérer les paramètres
organizerRouter.get('/settings/:userId', organizerController.getOrganizerSettings);

// Route pour mettre à jour les paramètres
organizerRouter.put('/settings/:userId', organizerController.updateOrganizerSettings);

module.exports = organizerRouter;
