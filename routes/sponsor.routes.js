const express = require('express');
const sponsorRouter = express.Router();
const sponsorController = require('../Controllers/sponsor.controller');

// Route pour la création d'un sponsor en attente
sponsorRouter.post('/register', sponsorController.createPendingSponsor);
// Route pour la confirmation de l'inscription du sponsor
sponsorRouter.get('/confirm/:token', sponsorController.confirmSponsor);

// Routes pour les statistiques des sponsors
sponsorRouter.get('/:sponsorId/packs', sponsorController.getSponsorPacks);
sponsorRouter.get('/:sponsorId/stats', sponsorController.getSponsorStats);

// Routes pour la gestion du profil
sponsorRouter.get('/:sponsorId/profile', sponsorController.getSponsorProfile);
sponsorRouter.put('/:sponsorId/update', sponsorController.updateSponsorProfile);

module.exports = sponsorRouter;
