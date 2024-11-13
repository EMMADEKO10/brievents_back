const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const ParrainageSchema = new Schema({
reference: { type: String, required: true, unique: true },
amount: { type: Number, required: true },
email: { type: String, required: true },
user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
},
event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
},
maxiCashTransactionId: { type: String },
createdAt: { type: Date, default: Date.now },
updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Parrainage = mongoose.model('Parrainage', ParrainageSchema);

const PendingParrainage = mongoose.model('PendingParrainage', ParrainageSchema);

module.exports = { Parrainage, PendingParrainage };