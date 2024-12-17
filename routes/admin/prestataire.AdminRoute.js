const express = require('express');
const adminPrestataireRouter = express.Router();
// const { authenticateToken, isAdmin } = require('../../middleware/authMiddleware');
const {
    updatePrestataire,
    deletePrestataireById,
    getPrestataireByIdAdmin,
    togglePrestataireStatus
} = require('../../Controllers/Admin/prestataire.adminControl');

// Route pour obtenir un prestataire spécifique (admin)
adminPrestataireRouter.get('/:id', getPrestataireByIdAdmin);

// Route pour mettre à jour un prestataire
adminPrestataireRouter.put('/:id', updatePrestataire);

// Route pour supprimer un prestataire
adminPrestataireRouter.delete('/:id', deletePrestataireById);

// Route pour activer/désactiver un prestataire
adminPrestataireRouter.put('/toggle-status/:id', togglePrestataireStatus);

module.exports = adminPrestataireRouter;
