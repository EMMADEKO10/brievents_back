const mongoose = require('mongoose');

const rewardLevelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    minPoints: {
        type: Number,
        required: true
    },
    maxPoints: {
        type: Number
    },
    benefits: {
        type: String
    },
    requiresInvitation: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('RewardLevel', rewardLevelSchema); 