const express = require('express');
const sponsorRouter = express.Router();
const sponsorController = require('../Controllers/sponsor.controller');

// Routes for handling sponsor operations
sponsorRouter.post('/', sponsorController.addSponsor);
sponsorRouter.delete('/:id', sponsorController.deleteSponsor);
sponsorRouter.get('/:id', sponsorController.getSponsor);
sponsorRouter.get('/', sponsorController.getAllSponsors);

// New route for sponsor validation
sponsorRouter.post('/validate/:token', sponsorController.confirmSponsor);

module.exports = sponsorRouter;

