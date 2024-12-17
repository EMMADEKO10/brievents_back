const express = require('express');
const adminSponsorRouter = express.Router();
const { authenticateToken, isAdmin } = require('../../middleware/authMiddleware');
const {
    updateSponsor,
    deleteSponsorById,
    getSponsorByIdAdmin,
    toggleSponsorStatus
} = require('../../Controllers/Admin/sponsor.adminControl');

// Route pour obtenir un sponsor spécifique (admin)
adminSponsorRouter.get('/:id', getSponsorByIdAdmin);

// Route pour mettre à jour un sponsor
adminSponsorRouter.put('/:id', updateSponsor);

// Route pour supprimer un sponsor
adminSponsorRouter.delete('/:id', deleteSponsorById);

// Route pour activer/désactiver un sponsor
adminSponsorRouter.put('/toggle-status/:id', toggleSponsorStatus);

module.exports = adminSponsorRouter;
