const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['SPONSOR_ADDED'],
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
  sponsor: {
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