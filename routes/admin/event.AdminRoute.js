const express = require('express');
const adminEventRouter = express.Router();
const { authenticateToken, isAdmin } = require('../../middleware/authMiddleware');
const upload = require('../../multer');
const {
    getAllEvents,
    updateEvent,
    deleteEventById,
    getEventByIdAdmin,
    changeEventStatus
} = require('../../Controllers/Admin/event.adminControl');

// Appliquer l'authentification et la vérification admin à toutes les routes
adminEventRouter.use(authenticateToken, isAdmin);

// Route pour obtenir tous les événements avec pagination et filtres
adminEventRouter.get('/', getAllEvents);

// Route pour obtenir un événement spécifique
adminEventRouter.get('/:id', getEventByIdAdmin);

// Route pour mettre à jour un événement
adminEventRouter.put('/:id', upload.single('logo'), updateEvent);

// Route pour changer le statut d'un événement
adminEventRouter.patch('/:id/status', changeEventStatus);

// Route pour supprimer un événement
adminEventRouter.delete('/:id', deleteEventById);

module.exports = adminEventRouter;
