const { Location, EventType, Theme } = require('../models/FilterCategory');
const asyncHandler = require('express-async-handler');

exports.getFilterCategories = asyncHandler(async (req, res) => {
  // Récupération parallèle des différentes catégories
  const [locations, eventTypes, themes] = await Promise.all([
    Location.find({ isActive: true }).sort('order').lean(),
    EventType.find({ isActive: true }).sort('order').lean(),
    Theme.find({ isActive: true }).sort('order').lean()
  ]);

  // Formation de la réponse
  const formattedCategories = {
    location: locations.map(loc => ({ name: loc.name, coordinates: loc.coordinates })),
    eventType: eventTypes.map(type => ({ name: type.name, icon: type.icon })),
    theme: themes.map(theme => ({ name: theme.name, color: theme.color }))
  };

  res.json(formattedCategories);
});

// Ajout des contrôleurs spécifiques pour chaque catégorie
exports.createLocation = asyncHandler(async (req, res) => {
  const location = await Location.create(req.body);
  res.status(201).json(location);
});

exports.createEventType = asyncHandler(async (req, res) => {
  const eventType = await EventType.create(req.body);
  res.status(201).json(eventType);
});

exports.createTheme = asyncHandler(async (req, res) => {
  const theme = await Theme.create(req.body);
  res.status(201).json(theme);
}); 