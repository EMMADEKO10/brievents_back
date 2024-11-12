const express = require('express');
const sponsorRouter = express.Router();
const sponsorController = require('../Controllers/sponsor.controller');

// Route pour la création d'un sponsor en attente
sponsorRouter.post('/register', sponsorController.createPendingSponsor);
// Route pour la confirmation de l'inscription du sponsor
sponsorRouter.get('/confirm/:token', sponsorController.confirmSponsor);

module.exports = sponsorRouter;
