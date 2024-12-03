const express = require('express');
const prestataireRouter = express.Router();
const prestataireController = require('../Controllers/prestataire.controller');
const prestataireStatController = require('../Controllers/prestataireStat/prestataire.stat.controller');

// Route pour la création d'un prestataire en attente
prestataireRouter.post('/register', prestataireController.createPendingPrestataire);
// Route pour la confirmation de l'inscription du prestataire
prestataireRouter.get('/confirm/:token', prestataireController.confirmPrestataire);

// Route pour obtenir tous les prestataires
prestataireRouter.get('/', prestataireController.getAllPrestataires);
// Route pour obtenir un prestataire par ID
prestataireRouter.get('/:id', prestataireController.getPrestataireById);
// Route pour obtenir l'historique des contacts d'un prestataire
prestataireRouter.get('/:id/contacts', prestataireController.getPrestataireContacts);
// Route pour ajouter une évaluation pour un prestataire
prestataireRouter.post('/:id/ratings', prestataireController.addRating);

// Route pour obtenir les events d'un prestataire
prestataireRouter.get('/:id/events', prestataireStatController.getPrestataireEvents);
// Route pour obtenir les statistiques d'un prestataire
prestataireRouter.get('/:id/stats', prestataireStatController.getPrestataireStats);

// Route pour obtenir les informations complètes d'un prestataire
prestataireRouter.get('/:id/full-info', prestataireStatController.getPrestataireFullInfo);
// Route pour obtenir les événements à venir d'un prestataire
prestataireRouter.get('/:id/upcoming-events', prestataireStatController.getPrestataireUpcomingEvents);

// Route pour la mise à jour des paramètres
prestataireRouter.put('/:id/update', prestataireController.updatePrestataireSettings);

//Roue pour l'affichage des prestataires d'un event
prestataireRouter.get('/:id/event/prestataires', prestataireController.getPrestatairesByEventId);

module.exports = prestataireRouter;
