const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['SPONSOR_ADDED','ADDED_TO_EVENT', 'REMOVED_FROM_EVENT'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  pack: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pack'
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema); 