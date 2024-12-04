const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  prestataire: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Prestataire', 
    required: true 
  },
  nom: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  prix: { 
    type: String, 
    required: true 
  },
  caracteristiques: [{ 
    type: String 
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Service', ServiceSchema); 