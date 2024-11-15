const { Rating, Prestataire } = require('../Models/prestataire.model');
const { Organizer } = require('../Models/organizer.model');

// Créer une nouvelle notation
const createRating = async (req, res) => {
  try {
    const { prestataireId, eventId, score, comment, criteria } = req.body;
    const organizerId = req.user.id; // Supposant que l'ID de l'utilisateur est disponible dans req.user

    // Vérifier que l'organisateur existe
    const organizer = await Organizer.findOne({ user: organizerId });
    if (!organizer) {
      return res.status(404).json({ message: "Organisateur non trouvé" });
    }

    // Vérifier que le prestataire existe
    const prestataire = await Prestataire.findById(prestataireId);
    if (!prestataire) {
      return res.status(404).json({ message: "Prestataire non trouvé" });
    }

    // Créer la nouvelle notation
    const newRating = new Rating({
      organizer: organizerId,
      prestataire: prestataireId,
      event: eventId,
      score,
      comment,
      criteria
    });

    await newRating.save();

    // Mettre à jour les statistiques de notation du prestataire
    const allRatings = await Rating.find({ prestataire: prestataireId });
    
    const totalRatings = allRatings.length;
    const averageScore = allRatings.reduce((acc, curr) => acc + curr.score, 0) / totalRatings;
    
    // Calculer les moyennes pour chaque critère
    const criteriaAverages = {
      professionnalisme: allRatings.reduce((acc, curr) => acc + curr.criteria.professionnalisme, 0) / totalRatings,
      communication: allRatings.reduce((acc, curr) => acc + curr.criteria.communication, 0) / totalRatings,
      qualiteService: allRatings.reduce((acc, curr) => acc + curr.criteria.qualiteService, 0) / totalRatings,
      rapportQualitePrix: allRatings.reduce((acc, curr) => acc + curr.criteria.rapportQualitePrix, 0) / totalRatings
    };

    // Mettre à jour le prestataire
    await Prestataire.findByIdAndUpdate(prestataireId, {
      ratings: {
        averageScore,
        totalRatings,
        criteriaAverages
      }
    });

    res.status(201).json(newRating);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Vous avez déjà noté ce prestataire pour cet événement" });
    }
    res.status(500).json({ message: "Erreur lors de la création de la notation", error: error.message });
  }
};

// Obtenir toutes les notations d'un prestataire
const getPrestataireRatings = async (req, res) => {
  try {
    const { prestataireId } = req.params;
    
    const ratings = await Rating.find({ prestataire: prestataireId })
      .populate('organizer', 'name')
      .populate('event', 'title');
      
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des notations", error: error.message });
  }
};

// Obtenir une notation spécifique
const getRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    
    const rating = await Rating.findById(ratingId)
      .populate('organizer', 'name')
      .populate('prestataire', 'name company')
      .populate('event', 'title');
      
    if (!rating) {
      return res.status(404).json({ message: "Notation non trouvée" });
    }
    
    res.json(rating);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de la notation", error: error.message });
  }
};

// Modifier une notation
const updateRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { score, comment, criteria } = req.body;
    const organizerId = req.user.id;

    const rating = await Rating.findById(ratingId);
    
    if (!rating) {
      return res.status(404).json({ message: "Notation non trouvée" });
    }

    if (rating.organizer.toString() !== organizerId) {
      return res.status(403).json({ message: "Non autorisé à modifier cette notation" });
    }

    rating.score = score;
    rating.comment = comment;
    rating.criteria = criteria;
    
    await rating.save();

    // Mettre à jour les statistiques du prestataire
    const allRatings = await Rating.find({ prestataire: rating.prestataire });
    const totalRatings = allRatings.length;
    const averageScore = allRatings.reduce((acc, curr) => acc + curr.score, 0) / totalRatings;
    
    const criteriaAverages = {
      professionnalisme: allRatings.reduce((acc, curr) => acc + curr.criteria.professionnalisme, 0) / totalRatings,
      communication: allRatings.reduce((acc, curr) => acc + curr.criteria.communication, 0) / totalRatings,
      qualiteService: allRatings.reduce((acc, curr) => acc + curr.criteria.qualiteService, 0) / totalRatings,
      rapportQualitePrix: allRatings.reduce((acc, curr) => acc + curr.criteria.rapportQualitePrix, 0) / totalRatings
    };

    await Prestataire.findByIdAndUpdate(rating.prestataire, {
      ratings: {
        averageScore,
        totalRatings,
        criteriaAverages
      }
    });

    res.json(rating);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la modification de la notation", error: error.message });
  }
};

// Supprimer une notation
const deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const organizerId = req.user.id;

    const rating = await Rating.findById(ratingId);
    
    if (!rating) {
      return res.status(404).json({ message: "Notation non trouvée" });
    }

    if (rating.organizer.toString() !== organizerId) {
      return res.status(403).json({ message: "Non autorisé à supprimer cette notation" });
    }

    const prestataireId = rating.prestataire;
    
    await Rating.findByIdAndDelete(ratingId);

    // Mettre à jour les statistiques du prestataire
    const allRatings = await Rating.find({ prestataire: prestataireId });
    const totalRatings = allRatings.length;
    
    if (totalRatings === 0) {
      await Prestataire.findByIdAndUpdate(prestataireId, {
        ratings: {
          averageScore: 0,
          totalRatings: 0,
          criteriaAverages: {
            professionnalisme: 0,
            communication: 0,
            qualiteService: 0,
            rapportQualitePrix: 0
          }
        }
      });
    } else {
      const averageScore = allRatings.reduce((acc, curr) => acc + curr.score, 0) / totalRatings;
      
      const criteriaAverages = {
        professionnalisme: allRatings.reduce((acc, curr) => acc + curr.criteria.professionnalisme, 0) / totalRatings,
        communication: allRatings.reduce((acc, curr) => acc + curr.criteria.communication, 0) / totalRatings,
        qualiteService: allRatings.reduce((acc, curr) => acc + curr.criteria.qualiteService, 0) / totalRatings,
        rapportQualitePrix: allRatings.reduce((acc, curr) => acc + curr.criteria.rapportQualitePrix, 0) / totalRatings
      };

      await Prestataire.findByIdAndUpdate(prestataireId, {
        ratings: {
          averageScore,
          totalRatings,
          criteriaAverages
        }
      });
    }

    res.json({ message: "Notation supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de la notation", error: error.message });
  }
};

module.exports = {
  createRating,
  getPrestataireRatings,
  getRating,
  updateRating,
  deleteRating
};
