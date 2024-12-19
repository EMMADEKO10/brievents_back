const mongoose = require('mongoose');

const paymentPackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pack: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pack',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PaymentPack', paymentPackSchema);