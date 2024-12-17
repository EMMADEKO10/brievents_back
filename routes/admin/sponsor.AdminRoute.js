const express = require('express');
const adminSponsorRouter = express.Router();
// const { authenticateToken, isAdmin } = require('../../middleware/authMiddleware');
const {
    updateSponsor,
    deleteSponsorById,
    getSponsorByIdAdmin,
    getPendingSponsors,
    validatePendingSponsor
} = require('../../Controllers/Admin/sponsor.adminControl');

// Route pour obtenir un sponsor spécifique (admin)
adminSponsorRouter.get('/:id', getSponsorByIdAdmin);

// Route pour mettre à jour un sponsor
adminSponsorRouter.put('/:id', updateSponsor);

// Route pour supprimer un sponsor
adminSponsorRouter.delete('/:id', deleteSponsorById);

// Route pour obtenir la liste des sponsors en attente
adminSponsorRouter.get('/pending/list', getPendingSponsors);

// Route pour valider un sponsor en attente
adminSponsorRouter.put('/pending/validate/:id', validatePendingSponsor);

module.exports = adminSponsorRouter;
