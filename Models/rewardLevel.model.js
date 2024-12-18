const mongoose = require('mongoose');

const RewardLevelSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    enum: ['EMERGENT', 'SILVER', 'GOLD', 'PLATINUM', 'LEGENDARY']
  },
  minPoints: { 
    type: Number, 
    required: true 
  },
  maxPoints: { 
    type: Number,
    default: null
  },
  benefits: [{ 
    type: String 
  }],
  requiresInvitation: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const RewardLevel = mongoose.model('RewardLevel', RewardLevelSchema);

module.exports = RewardLevel; 