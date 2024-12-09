const express = require('express');
const router = express.Router();
const notificationController = require('../../notifications/prestataire/notification.controller');

// Obtenir les notifications d'un prestataire
router.get('/:prestataireId', notificationController.getPrestataireNotifications);

module.exports = router; 