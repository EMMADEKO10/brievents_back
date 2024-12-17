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

const SponsorLevelSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['EMERGENT', 'SILVER', 'GOLD', 'PLATINUM', 'LEGENDARY'],
    required: true
  },
  minPoints: { type: Number, required: true },
  maxPoints: { type: Number },
  benefits: [{ type: String }],
  isInviteOnly: { type: Boolean, default: false }
});

const SponsorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true },
  language: { type: String, required: true },
  phone: { type: String },
  totalPoints: { type: Number, default: 0 },
  currentLevel: { type: mongoose.Schema.Types.ObjectId, ref: 'SponsorLevel' },
  pointsHistory: [{
    points: Number,
    source: { type: String, enum: ['INVESTMENT', 'PROJECT'] },
    date: { type: Date, default: Date.now },
    details: String
  }]
}, { timestamps: true });

const PendingSponsor = mongoose.model('PendingSponsor', PendingSponsorSchema);
const Sponsor = mongoose.model('Sponsor', SponsorSchema);
const SponsorLevel = mongoose.model('SponsorLevel', SponsorLevelSchema);

module.exports = { Sponsor, PendingSponsor, SponsorLevel };
