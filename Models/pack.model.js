const mongoose = require('mongoose');

const packSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    paymentType: {
        type: String,
        enum: ['online', 'cash'],
        required: true,
        default: 'online'
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    deadline: {
        type: Date,
        required: true
    },
    maxSponsors: {
        type: Number,
        required: true
    },
    currentSponsors: {
        type: Number,
        default: 0
    },
    benefits: {
        type: String,
        required: true
    },
    priority: {
        type: Number,
        required: true,
        min: 1,
        max: 3
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Pack', packSchema);
