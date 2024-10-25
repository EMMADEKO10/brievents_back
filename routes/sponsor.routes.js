const express = require('express');
const sponsorRuter = express.Router();
const sponsorController = require('../Controllers/sponsor.controller');

// Route pour la création d'un sponsor en attente
sponsorRuter.post('/register', sponsorController.createPendingSponsor);
// Route pour la confirmation de l'inscription du sponsor
sponsorRuter.get('/confirm/:token', sponsorController.confirmSponsor);

module.exports = sponsorRuter;
