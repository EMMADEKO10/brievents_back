const mongoose = require('mongoose');

// Schéma de base commun
const baseFilterSchema = {
  name: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
};

// Schéma pour la localisation
const locationSchema = new mongoose.Schema({
  ...baseFilterSchema,
  coordinates: {
    lat: Number,
    lng: Number
  }
}, { timestamps: true });

// Schéma pour le type d'événement
const eventTypeSchema = new mongoose.Schema({
  ...baseFilterSchema,
  icon: String
}, { timestamps: true });

// Schéma pour le thème
const themeSchema = new mongoose.Schema({
  ...baseFilterSchema,
  color: String
}, { timestamps: true });

// Création des modèles
const Location = mongoose.model('Location', locationSchema);
const EventType = mongoose.model('EventType', eventTypeSchema);
const Theme = mongoose.model('Theme', themeSchema);

module.exports = {
  Location,
  EventType,
  Theme
}; 