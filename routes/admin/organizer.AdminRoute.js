const express = require('express');
const adminOrganizerRouter = express.Router();
const { authenticateToken, isAdmin } = require('../../middleware/authMiddleware');
const {
    updateOrganizer,
    deleteOrganizerById,
    getOrganizerByIdAdmin,
    getPendingOrganizers,
    validatePendingOrganizer
} = require('../../Controllers/Admin/organizer.adminControl');

// Route pour obtenir un organisateur spécifique (admin)
adminOrganizerRouter.get('/:id', getOrganizerByIdAdmin);

// Route pour mettre à jour un organisateur
adminOrganizerRouter.put('/:id', updateOrganizer);

// Route pour supprimer un organisateur
adminOrganizerRouter.delete('/:id', deleteOrganizerById);

// Route pour obtenir la liste des organisateurs en attente
adminOrganizerRouter.get('/pending/list', getPendingOrganizers);

// Route pour valider un organisateur en attente
adminOrganizerRouter.put('/pending/validate/:id', validatePendingOrganizer);

module.exports = adminOrganizerRouter;
