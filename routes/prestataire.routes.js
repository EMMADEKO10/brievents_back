const express = require('express');
const prestataireRouter = express.Router();
const prestataireController = require('../Controllers/prestataire.controller');

// Route pour la création d'un prestataire en attente
prestataireRouter.post('/register', prestataireController.createPendingPrestataire);
// Route pour la confirmation de l'inscription du prestataire
prestataireRouter.get('/confirm/:token', prestataireController.confirmPrestataire);

// Route pour obtenir tous les prestataires
prestataireRouter.get('/', prestataireController.getAllPrestataires);
// Route pour obtenir un prestataire par ID
prestataireRouter.get('/:id', prestataireController.getPrestataireById);

module.exports = prestataireRouter;
