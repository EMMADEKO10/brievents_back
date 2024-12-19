const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const PaymentPackSchema = new Schema({
reference: { type: String, required: true, unique: true },
amount: { type: Number, required: true },
email: { type: String, required: true },
user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
},
pack: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pack',
    required: true,
},
maxiCashTransactionId: { type: String },
createdAt: { type: Date, default: Date.now },
updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const PaymentPack = mongoose.model('PaymentPack', PaymentPackSchema);

const PendingPaymentPack = mongoose.model('PendingPaymentPack', PaymentPackSchema);

module.exports = { PaymentPack, PendingPaymentPack };