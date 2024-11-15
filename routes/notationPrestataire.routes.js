const express = require('express');
const notationRouter = express.Router();
const notationController = require('../Controllers/notationPrestataire.controller');

// Route pour créer une nouvelle notation
notationRouter.post('/create', notationController.createRating);

// Route pour obtenir toutes les notations d'un prestataire
notationRouter.get('/prestataire/:prestataireId', notationController.getPrestataireRatings);

// Route pour obtenir une notation spécifique
notationRouter.get('/:ratingId', notationController.getRating);

// Route pour modifier une notation
notationRouter.put('/:ratingId', notationController.updateRating);

// Route pour supprimer une notation
notationRouter.delete('/:ratingId', notationController.deleteRating);

module.exports = notationRouter;
