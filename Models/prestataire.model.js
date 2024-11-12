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
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const PendingPrestataire = mongoose.model('PendingPrestataire', PendingPrestataireSchema);
const Prestataire = mongoose.model('Prestataire', PrestataireSchema);

module.exports = { PendingPrestataire, Prestataire };