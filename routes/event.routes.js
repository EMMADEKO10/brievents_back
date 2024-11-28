// routes/event.routes.js
const express = require('express');
const eventRouter = express.Router();
const eventController = require('../Controllers/event.controller');
const upload = require('../configs/multer.config');
 const authorize = require('../Middlewares/auth.middleware'); // Assurez-vous d'avoir un middleware d'authentification
 
// Route pour créer un événement
// Le middleware upload.single('logo') s'attend à recevoir un fichier avec le nom 'logo'
eventRouter.post('/add', 
  // auth, // Protection de la route
  upload.single('logo'), 
  eventController.createEvent
);
eventRouter.get('/', eventController.getAllEventsClient);
eventRouter.get('/:id', eventController.getEventById);
eventRouter.post('/:id/prestataires/:prestataireId', eventController.addPrestataireToEvent);
eventRouter.delete('/:id/prestataires/:prestataireId', eventController.removePrestataireFromEvent);
// Route pour obtenir les événements par type
eventRouter.get('/type/:eventType', eventController.getEventsByType);
eventRouter.get('/user/:userId', eventController.getUserValidEvents);
eventRouter.get('/user/pending/:userId', eventController.getUserPendingEvents);


module.exports = eventRouter;


// // Route pour obtenir tous les événements
// // Possibilité de filtrer avec des query params
// eventRouter.get('/', eventController.getAllEvents);

// // Route pour obtenir un événement spécifique
// eventRouter.get('/:id', eventController.getEventById);

// // Route pour mettre à jour un événement
// eventRouter.put('/:id', 
//   // auth,
//   upload.single('logo'),
//   eventController.updateEvent
// );

// // Route pour supprimer un événement
// eventRouter.delete('/:id',
//   // auth,
//   eventController.deleteEvent
// );

// // Route pour obtenir les événements par type
// eventRouter.get('/type/:eventType', eventController.getEventsByType);

// // Route pour obtenir les événements par thème
// eventRouter.get('/theme/:theme', eventController.getEventsByTheme);

// // Route pour obtenir les événements par localisation
// eventRouter.get('/location/:location', eventController.getEventsByLocation);

// // Route pour obtenir les événements par statut
// eventRouter.get('/status/:status', eventController.getEventsByStatus);

// // Route pour obtenir les événements par date
// eventRouter.get('/date/:startDate/:endDate', eventController.getEventsByDateRange);

// // Route pour changer le statut d'un événement
// eventRouter.patch('/:id/status',
//   // auth,
//   eventController.updateEventStatus
// );

// Export du router