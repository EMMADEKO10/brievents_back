const mongoose = require('mongoose');

const PendingSponsorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  company: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  language: { type: String, required: true },
  isValidating : { type: Boolean, required: true, default: false },
  validationToken: { type: String, required: true },
  tokenExpiration: { type: Date, required: true },
}, { timestamps: true });

const SponsorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true },
  language: { type: String, required: true },
}, { timestamps: true });

const PendingSponsor = mongoose.model('PendingSponsor', PendingSponsorSchema);
const Sponsor = mongoose.model('Sponsor', SponsorSchema);

module.exports = { Sponsor, PendingSponsor };
