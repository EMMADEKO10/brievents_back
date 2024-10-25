// controllers/event.controllers.js
const Event = require('../Models/events.model');

// Créer un nouvel événement
const createEvent = async (req, res) => {
  const { title, description, date, location } = req.body;
  const image = req.file ? req.file.path : null;
  // const createdBy = req.user._id; // Assurez-vous que l'utilisateur est authentifié
  const createdBy = "66952e9877512bf7edd5e310"; // Assurez-vous que l'utilisateur est authentifié
  try {
    const newEvent = new Event({
      title,
      description,
      date,
      location,
      image,
      createdBy
    });
    await newEvent.save();
    res.json({ message: 'Événement créé avec succès', event: newEvent });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
};

// Obtenir tous les événements
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', 'name email');
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
};

// Obtenir un événement par ID
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
    if (!event) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }
    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
};

// Mettre à jour un événement par ID
const updateEvent = async (req, res) => {
  const { title, description, date, location, backgroundImage } = req.body;
  try {
    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.location = location || event.location;
    event.backgroundImage = backgroundImage || event.backgroundImage;
    await event.save();

    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
};

// Supprimer un événement par ID
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    await Event.deleteOne({ _id: req.params.id });
    res.json({ message: 'Événement supprimé avec succès' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};
