const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, getOrganizerNotifications } = require('./notification.controller')
// const auth = require('../middleware/auth');

router.get('/', getNotifications);
router.patch('/:notificationId/read', markAsRead);
router.get('/organizer/:organizerId', getOrganizerNotifications);

module.exports = router; 