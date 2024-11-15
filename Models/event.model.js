// models/Evenement.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
    required: false, // Rend le logo optionnel avec une valeur par défaut
  },
  budget: {
    type: Number,
    required: true,
  },
  participants: {
    type: Number,
    required: true,
  },
  eventType: {
    type: String,
    required: true,
  },
  customEventType: {
    type: String,
  },
  theme: {
    type: String,
    required: true,
  },
  customTheme: {
    type: String,
  },
  location: {
    type: String,
    required: true,
  },
  postalAddress: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  links: {
    type: [String],
    default: [],
  },
  socialMedia: {
    facebook: String,
    twitter: String,
    linkedin: String,
  },
  status: {
    type: String,
    enum: ['En attente', 'Publié', 'Annulé', 'Terminé'],
    default: 'En attente',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prestataires: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prestataire',
      required: false,
    },
  ],
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;












// const mongoose = require('mongoose');

// const eventSchema = new mongoose.Schema({
//   logo: {
//     type: String,
//     default: '' // Rend le logo optionnel avec une valeur par défaut
//   },
//   title: {
//     type: String,
//     required: [true, 'Le titre est requis']
//   },
//   description: {
//     type: String,
//     required: [true, 'La description est requise']
//   },
//   budget: {
//     type: Number,
//     required: [true, 'Le budget est requis']
//   },
//   participants: {
//     type: Number,
//     required: [true, 'Le nombre de participants est requis']
//   },
//   eventType: {
//     type: String,
//     required: [true, 'Le type d\'événement est requis']
//   },
//   customEventType: String,
//   theme: {
//     type: String,
//     required: [true, 'Le thème est requis']
//   },
//   customTheme: String,
//   location: {
//     type: String,
//     required: [true, 'La localisation est requise']
//   },
//   postalAddress: {
//     type: String,
//     required: [true, 'L\'adresse postale est requise']
//   },
//   startDate: {
//     type: Date,
//     required: [true, 'La date de début est requise']
//   },
//   endDate: {
//     type: Date,
//     required: [true, 'La date de fin est requise']
//   },
//   links: [String],
//   socialMedia: {
//     facebook: String,
//     twitter: String,
//     linkedin: String
//   },
//   status: {
//     type: String,
//     default: 'En attente'
//   }
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('Event', eventSchema);