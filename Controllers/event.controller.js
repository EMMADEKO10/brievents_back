const Event = require('../Models/event.model');
const { cloudinary, getUploadFolder } = require('../cloudinary');
const User = require('../Models/user.model');
const Organizer = require('../Models/organizer.model');
const { Prestataire } = require('../Models/prestataire.model');
// ----------------------------------------------------------------------
exports.getAllEventsClient = async (req, res) => {
  try {
    const events = await Event.find({});
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir tous les événements valides d'un utilisateur
exports.getUserValidEvents = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const events = await Event.find({
      createdBy: userId,
      status: 'Publié' // Ne retourne que les événements publiés/valides
    }).populate('createdBy', 'name email');

    if (!events) {
      return res.status(404).json({ message: 'Aucun événement trouvé pour cet utilisateur' });
    }

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des événements',
      error: error.message 
    });
  }
};

// Obtenir tous les événements en attente d'un utilisateur
exports.getUserPendingEvents = async (req, res) => {
  try {
    const userId = req.params.userId;
    const events = await Event.find({
      createdBy: userId,
      status: 'En attente' // Ne retourne que les événements en attente
    }).populate('createdBy', 'name email');

    if (!events) {
      return res.status(404).json({ message: 'Aucun événement trouvé pour cet utilisateur' });
    }

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des événements',
      error: error.message 
    });
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

// Ajouter un prestataire à l'événement
// Définition du contrôleur
exports.addPrestataireToEvent = async (req, res) => {
  try {
    const { id, prestataireId } = req.params;
    // console.log('ID événement:', id);
    // console.log('ID prestataire:', prestataireId);

    // Votre logique pour ajouter le prestataire
    // Par exemple :
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé" });
    }

    const prestataire = await Prestataire.findById(prestataireId);
    if (!prestataire) {
      return res.status(404).json({ message: "Prestataire non trouvé" });
    }

    // Ajouter le prestataire s'il n'existe pas déjà
    if (!event.prestataires.includes(prestataireId)) {
      event.prestataires.push(prestataireId);
      await event.save();
    }

    res.status(200).json({ message: "Prestataire ajouté avec succès", event });
  } catch (error) {
    console.error('Erreur dans addPrestataireToEvent:', error);
    res.status(500).json({ message: error.message });
  }
};

// Retirer un prestataire de l'événement
exports.removePrestataireFromEvent = async (req, res) => {
  try {
    const { id, prestataireId } = req.params;
    console.log('ID événement:', id);
    console.log('ID prestataire:', prestataireId);

    // Vérifier si l'événement existe
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérifier si le prestataire est bien dans l'événement
    if (!event.prestataires || !event.prestataires.includes(prestataireId)) {
      return res.status(400).json({ message: 'Ce prestataire n\'est pas dans l\'événement' });
    }

    // Retirer le prestataire de l'événement
    event.prestataires = event.prestataires.filter(
      id => id.toString() !== prestataireId
    );
    await event.save();

    res.status(200).json({
      message: 'Prestataire retiré avec succès de l\'événement',
      event
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
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

  // Obtenir un événement par id
  exports.getEventById = async (req, res) => {
    try {
      const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
      if (!event) {
        return res.status(404).json({ message: 'Événement non trouvé' });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Obtenir les informations de l'utilisateur et de l'organisateur qui a créé l'événement
  exports.getEventCreatorInfo = async (req, res) => {
    try {
      const event = await Event.findById(req.params.id).populate('createdBy', 'name email').populate('organizer', 'name email');
      if (!event) {
        return res.status(404).json({ message: 'Événement non trouvé' });
      }
      const userInfo = event.createdBy;
      const organizerInfo = event.organizer;
      res.json({ userInfo, organizerInfo });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // Ajouter cette nouvelle méthode dans event.controller.js
  exports.getAllUserEvents = async (req, res) => {
    try {
      const userId = req.params.userId;
      
      // Récupérer tous les événements de l'utilisateur
      const events = await Event.find({ createdBy: userId })
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 }); // Tri par date de création décroissante

      if (!events) {
        return res.status(404).json({ 
          success: false,
          message: 'Aucun événement trouvé pour cet utilisateur' 
        });
      }

      // Pour chaque événement, récupérer les statistiques associées
      const eventsWithStats = await Promise.all(events.map(async (event) => {
        // Vous pouvez ajouter ici d'autres statistiques si nécessaire
        const stats = {
          totalSponsors: 0, // À implémenter selon votre logique
          totalRevenue: 0,  // À implémenter selon votre logique
          // ... autres statistiques
        };

        return {
          ...event.toObject(),
          stats
        };
      }));

      res.status(200).json({
        success: true,
        data: eventsWithStats
      });
    } catch (error) {
      console.error('Erreur dans getAllUserEvents:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération des événements',
        error: error.message 
      });
    }
  };
