const Event = require('../Models/event.model');
const { cloudinary, getUploadFolder } = require('../cloudinary');


exports.getAllEventsClient = async (req, res) => {
  try {
    const events = await Event.find({});
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    // Vérifier si eventData est présent et valide
    // if (!req.body.eventData) {
    //   return res.status(400).json({ message: 'Les données de l\'événement sont requises' });
    // }
console.log(req.body.eventData);
    let eventData;
    try {
      eventData = JSON.parse(req.body.eventData);
      console.log("voici eventData",eventData);

    } catch (error) {
      return res.status(400).json({ message: 'Format de données invalide' });
    }

    let logoUrl = '';
    if (req.file) {
      try {
        // Définition du dossier de stockage
        const uploadFolder = getUploadFolder();
        console.log("Uploading logo to Cloudinary...");
        // Upload directement le buffer du fichier
        const uploadedLogo = await cloudinary.uploader.upload(req.file.path, {
          folder: uploadFolder,
        });
        
        console.log("Logo uploaded to Cloudinary:", uploadedLogo.secure_url);
        logoUrl = uploadedLogo.secure_url;
      } catch (uploadError) {
        console.error('Erreur upload:', uploadError);
        return res.status(500).json({ 
          message: 'Erreur lors de l\'upload de l\'image',
          error: uploadError.message 
        });
      }
    }

    // Créer l'événement
    const event = new Event({
      ...eventData,
      logo: logoUrl
    });

    const savedEvent = await event.save();
    res.status(201).json({
      message: 'Événement créé avec succès',
      event: savedEvent
    });

  } catch (error) {
    console.error('Erreur création événement:', error);
    res.status(400).json({
      message: error.message || 'Erreur lors de la création de l\'événement'
    });
  }
};


exports.updateEvent = async (req, res) => {
  try {
    const eventData = JSON.parse(req.body.eventData);
    let updateData = { ...eventData };

    if (req.files && req.files.length > 0) {
      const result = await cloudinary.uploader.upload(req.files[0].path, {
        folder: getUploadFolder(),
        resource_type: 'image'
      });
      updateData.logo = result.secure_url;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// Obtenir les événements par type
exports.getEventsByType = async (req, res) => {
    try {
      const events = await Event.find({ eventType: req.params.eventType });
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Obtenir les événements par thème
  exports.getEventsByTheme = async (req, res) => {
    try {
      const events = await Event.find({ theme: req.params.theme });
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Obtenir les événements par localisation
  exports.getEventsByLocation = async (req, res) => {
    try {
      const events = await Event.find({ location: req.params.location });
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Obtenir les événements par statut
  exports.getEventsByStatus = async (req, res) => {
    try {
      const events = await Event.find({ status: req.params.status });
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Obtenir les événements par plage de dates
  exports.getEventsByDateRange = async (req, res) => {
    try {
      const { startDate, endDate } = req.params;
      const events = await Event.find({
        startDate: { $gte: new Date(startDate) },
        endDate: { $lte: new Date(endDate) }
      });
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Mettre à jour le statut d'un événement
  exports.updateEventStatus = async (req, res) => {
    try {
      const { status } = req.body;
      if (!['En attente', 'Publié', 'Annulé', 'Terminé'].includes(status)) {
        return res.status(400).json({ message: 'Statut invalide' });
      }
  
      const event = await Event.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
  
      if (!event) {
        return res.status(404).json({ message: 'Événement non trouvé' });
      }
  
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Obtenir tous les événements avec filtres optionnels
  exports.getAllEvents = async (req, res) => {
    try {
      const {
        type,
        theme,
        location,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 10
      } = req.query;
  
      // Construire le filtre
      const filter = {};
      if (type) filter.eventType = type;
      if (theme) filter.theme = theme;
      if (location) filter.location = location;
      if (status) filter.status = status;
      if (startDate && endDate) {
        filter.startDate = { $gte: new Date(startDate) };
        filter.endDate = { $lte: new Date(endDate) };
      }
  
      // Pagination
      const skip = (page - 1) * limit;
      // Exécuter la requête
      const events = await Event.find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });
  
      // Obtenir le nombre total pour la pagination
      const total = await Event.countDocuments(filter);
  
      res.json({
        events,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalEvents: total
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };