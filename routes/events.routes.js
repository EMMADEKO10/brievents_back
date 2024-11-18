// routes/event.route.js
const express = require('express');
const upload = require('../configs/multer.config')
const eventRouter = express.Router();
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  addPrestataireToEvent,
  removePrestataireFromEvent,
  getEventsByType
} = require('../Controllers/events.controller');
// const authMiddleware = require('../middleware/authMiddleware');
// const adminMiddleware = require('../middleware/adminMiddleware');

// Route pour créer un nouvel événement
eventRouter.post('/',upload.single('image'), createEvent);

// Route pour obtenir tous les événements
eventRouter.get('/',  getAllEvents);

// Route pour obtenir un événement par ID
eventRouter.get('/:id',  getEventById);

// Route pour mettre à jour un événement par ID
eventRouter.put('/:id',  updateEvent);

// Route pour supprimer un événement par ID
eventRouter.delete('/:id',  deleteEvent);

// Route pour ajouter un prestataire à un événement
// Dans votre fichier de routes
eventRouter.post('/:id/prestataires/:prestataireId', (req, res, next) => {
  console.log('Route appelée avec params:', req.params);
  addPrestataireToEvent(req, res, next);
});

// Route pour retirer un prestataire d'un événement
eventRouter.delete('/:id/prestataires/:prestataireId', removePrestataireFromEvent);

// Route pour obtenir les événements par type
eventRouter.get('/type/:eventType', getEventsByType);

module.exports = eventRouter;
