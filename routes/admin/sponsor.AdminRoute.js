const express = require('express');
const adminSponsorRouter = express.Router();
const { authenticateToken, isAdmin } = require('../../middleware/authMiddleware');
const {
    getAllSponsors,
    updateSponsor,
    deleteSponsorById,
    getSponsorByIdAdmin,
    getPendingSponsors,
    validatePendingSponsor,
    getSponsorStats
} = require('../../Controllers/Admin/sponsor.adminControl');

// Appliquer l'authentification et la vérification admin à toutes les routes
adminSponsorRouter.use(authenticateToken, isAdmin);

// Route pour obtenir tous les sponsors avec pagination et filtres
adminSponsorRouter.get('/', getAllSponsors);

// Route pour obtenir les statistiques d'un sponsor
adminSponsorRouter.get('/:id/stats', getSponsorStats);

// Route pour obtenir un sponsor spécifique
adminSponsorRouter.get('/:id', getSponsorByIdAdmin);

// Route pour mettre à jour un sponsor
adminSponsorRouter.put('/:id', updateSponsor);

// Route pour supprimer un sponsor
adminSponsorRouter.delete('/:id', deleteSponsorById);

// Routes pour la gestion des sponsors en attente
adminSponsorRouter.get('/pending/list', getPendingSponsors);
adminSponsorRouter.post('/pending/:id/validate', validatePendingSponsor);

module.exports = adminSponsorRouter;
