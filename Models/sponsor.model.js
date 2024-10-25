const mongoose = require('mongoose');

const SponsorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});


const Sponsor = mongoose.model('Sponsor', SponsorSchema);   

// ---------------------------------------------------------------------------------------

const PendingSponsorSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  language: { 
    type: String, 
    required: true 
  },

  validationToken: {
    type: String,
    required: true
  },
  tokenExpiration: {
    type: Date,
    required: true
  }
}, { timestamps: true });

PendingSponsor = mongoose.model('PendingSponsor', PendingSponsorSchema);

module.exports ={Sponsor, PendingSponsor};














