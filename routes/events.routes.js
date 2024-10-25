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

module.exports = eventRouter;
