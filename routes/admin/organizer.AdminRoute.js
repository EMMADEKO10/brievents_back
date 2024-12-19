const express = require('express');
const adminOrganizerRouter = express.Router();
const { authenticateToken, isAdmin } = require('../../middleware/authMiddleware');
const {
    getAllOrganizers,
    updateOrganizer,
    deleteOrganizerById,
    getOrganizerByIdAdmin,
    getPendingOrganizers,
    validatePendingOrganizer
} = require('../../Controllers/Admin/organizer.adminControl');

// Appliquer l'authentification et la vérification admin à toutes les routes
adminOrganizerRouter.use(authenticateToken, isAdmin);

// Route pour obtenir tous les organisateurs avec pagination et filtres
adminOrganizerRouter.get('/', getAllOrganizers);

// Route pour obtenir un organisateur spécifique
adminOrganizerRouter.get('/:id', getOrganizerByIdAdmin);

// Route pour mettre à jour un organisateur
adminOrganizerRouter.put('/:id', updateOrganizer);

// Route pour supprimer un organisateur
adminOrganizerRouter.delete('/:id', deleteOrganizerById);

// Route pour obtenir la liste des organisateurs en attente
adminOrganizerRouter.get('/pending/list', getPendingOrganizers);

// Route pour valider/rejeter un organisateur en attente
adminOrganizerRouter.post('/pending/:id/validate', validatePendingOrganizer);

module.exports = adminOrganizerRouter;
