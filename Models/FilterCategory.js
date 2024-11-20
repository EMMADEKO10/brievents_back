const mongoose = require('mongoose');

const filterCategorySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['location', 'eventType', 'theme']
  },
  name: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FilterCategory', filterCategorySchema); 