const express = require('express');
const adminPrestataireRouter = express.Router();
const { authenticateToken, isAdmin } = require('../../middleware/authMiddleware');
const {
    getAllPrestataires,
    updatePrestataire,
    deletePrestataireById,
    getPrestataireByIdAdmin,
    togglePrestataireStatus,
    getPrestataireStats
} = require('../../Controllers/Admin/prestataire.adminControl');

// Appliquer l'authentification et la vérification admin à toutes les routes
adminPrestataireRouter.use(authenticateToken, isAdmin);

// Route pour obtenir tous les prestataires avec pagination et filtres
adminPrestataireRouter.get('/', getAllPrestataires);

// Route pour obtenir un prestataire spécifique
adminPrestataireRouter.get('/:id', getPrestataireByIdAdmin);

// Route pour obtenir les statistiques d'un prestataire
adminPrestataireRouter.get('/:id/stats', getPrestataireStats);

// Route pour mettre à jour un prestataire
adminPrestataireRouter.put('/:id', updatePrestataire);

// Route pour supprimer un prestataire
adminPrestataireRouter.delete('/:id', deletePrestataireById);

// Route pour activer/désactiver un prestataire
adminPrestataireRouter.patch('/:id/toggle-status', togglePrestataireStatus);

module.exports = adminPrestataireRouter;
