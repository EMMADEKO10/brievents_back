const express = require('express');
const adminEventRouter = express.Router();
// const { authenticateToken, isAdmin } = require('../../middleware/authMiddleware');
const upload = require('../../multer');
const {
    updateEvent,
    deleteEventById,
    getEventByIdAdmin
} = require('../../Controllers/Admin/event.adminControl');

// Route pour obtenir un événement spécifique (admin)
adminEventRouter.get('/:id', getEventByIdAdmin);

// Route pour mettre à jour un événement
adminEventRouter.put('/:id', upload.single('image'), updateEvent);

// Route pour supprimer un événement
adminEventRouter.delete('/:id', deleteEventById);

module.exports = adminEventRouter;
