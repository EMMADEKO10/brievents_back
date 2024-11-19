// prestataire.model.js
const mongoose = require('mongoose');

const PendingPrestataireSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  company: { type: String, required: true },
  companyType: { 
    type: String, 
    required: true,
    enum: ['sarl', 'sa', 'sas', 'scs', 'snc']
  },
  registrationNumber: { type: String, required: true },
  serviceCategory: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  language: { type: String, required: true },
  newsletter: { type: Boolean, default: false },
  isValidating: { type: Boolean, default: false },
  validationToken: { type: String, required: true },
  tokenExpiration: { type: Date, required: true }
}, { timestamps: true });

const ContactHistorySchema = new mongoose.Schema({
  _id: { type: String },
  organizer: {
    _id: { type: String },
    company: { type: String },
    contactDate: { type: String }
  },
  rating: {
    score: { type: Number },
    comment: { type: String }
  }
});

const PrestataireSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  company: { type: String, required: true },
  companyType: { 
    type: String, 
    required: true,
    enum: ['sarl', 'sa', 'sas', 'scs', 'snc']
  },
  registrationNumber: { type: String, required: true },
  serviceCategory: { type: String, required: true },
  phone: { type: String, required: true },
  newsletter: { type: Boolean, default: false },
  language: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  ratings: {
    averageScore: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    criteriaAverages: {
      professionnalisme: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      qualiteService: { type: Number, default: 0 },
      rapportQualitePrix: { type: Number, default: 0 }
    }
  },
  contactHistory: [ContactHistorySchema]
}, { timestamps: true });

const PendingPrestataire = mongoose.model('PendingPrestataire', PendingPrestataireSchema);
const Prestataire = mongoose.model('Prestataire', PrestataireSchema);

// Schéma pour une note individuelle
const RatingSchema = new mongoose.Schema({
  organizer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  prestataire: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Prestataire', 
    required: true 
  },
  event: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  score: { 
    type: Number, 
    required: true,
    min: 0,
    max: 5
  },
  comment: { 
    type: String,
    maxLength: 500
  },
  criteria: {
    professionnalisme: { type: Number, required: true, min: 0, max: 5 },
    communication: { type: Number, required: true, min: 0, max: 5 },
    qualiteService: { type: Number, required: true, min: 0, max: 5 },
    rapportQualitePrix: { type: Number, required: true, min: 0, max: 5 }
  }
}, { 
  timestamps: true 
});
// Index unique pour empêcher les doublons de notation
RatingSchema.index({ organizer: 1, prestataire: 1, event: 1 }, { unique: true });

const Rating = mongoose.model('Rating', RatingSchema);

module.exports = { PendingPrestataire, Prestataire, Rating };