// prestataire.controller.js
const crypto = require('crypto');
const { Prestataire } = require('../../Models/prestataire.model');
const {Rating} = require('../../Models/prestataire.model');
const Event = require('../../Models/event.model');
const { User } = require('../../Models/user.model');


// Obtenir tous les événements d'un prestataire
exports.getPrestataireEvents = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('ID reçu dans getPrestataireEvents:', id);
      
        const prestataireSeach = await Prestataire.findOne({ user: id });
        // console.log('PrestataireId trouvé:', prestataireSeach._id);

        // Vérifier si le prestataire existe
        const prestataire = await Prestataire.findById(prestataireSeach._id).maxTimeMS(5000);
        console.log('Données du prestataire:', prestataire);

        if (!prestataire) {
          return res.status(404).json({
            success: false,
            error: 'Prestataire non trouvé'
          });
        }
    
        // Rechercher tous les événements où le prestataire est impliqué
        const events = await Event.find({ 
          prestataires: prestataire._id 
        })
        // .populate('organizer', 'company email')
        // .select('name startDate endDate location')
        .maxTimeMS(5000);
    
        console.log('Événements trouvés:', events);

        res.status(200).json({
          success: true,
          data: events
        });
    } catch (error) {
        console.error('Erreur Backend:', error);
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des événements'
        });
    }
};
  
// Obtenir les statistiques d'un prestataire
exports.getPrestataireStats = async (req, res) => {
    try {
        const { id } = req.params;
        // console.log('ID reçu dans getPrestataireStats:', id);

        const prestataireSeach = await Prestataire.findOne({ user: id });
        // console.log('PrestataireId trouvé:', prestataireSeach._id);

        // Vérifier si le prestataire existe
        const prestataire = await Prestataire.findById(prestataireSeach._id).maxTimeMS(5000);
        // console.log('Données du prestataire:', prestataire);

        if (!prestataire) {
          return res.status(404).json({
            success: false,
            error: 'Prestataire non trouvé'
          });
        }
    
        // Rechercher tous les événements où le prestataire est impliqué
        const events = await Event.find({ 
            prestataires: prestataire._id 
          })
          // .populate('organizer', 'company email')
          // .select('name startDate endDate location')
          .maxTimeMS(5000);
        // console.log('Événements trouvés:', events);
    
        // Récupérer toutes les évaluations
        const ratings = await Rating.find({ 
          prestataire: prestataire._id 
        }).maxTimeMS(5000);
        // console.log('Évaluations trouvées:', ratings);
    
        // Calculer les statistiques
        const stats = {
          totalEvents: events.length,
          completedEvents: events.filter(e => e.status === 'Publié').length,
          ongoingEvents: events.filter(e => e.status === 'En attente').length,
          totalRatings: ratings.length,
          averageRating: ratings.length > 0 
            ? ratings.reduce((acc, curr) => acc + curr.score, 0) / ratings.length 
            : 0,
          criteriaStats: {
            professionnalisme: ratings.length > 0 
              ? ratings.reduce((acc, curr) => acc + curr.criteria.professionnalisme, 0) / ratings.length 
              : 0,
            communication: ratings.length > 0 
              ? ratings.reduce((acc, curr) => acc + curr.criteria.communication, 0) / ratings.length 
              : 0,
            qualiteService: ratings.length > 0 
              ? ratings.reduce((acc, curr) => acc + curr.criteria.qualiteService, 0) / ratings.length 
              : 0,
            rapportQualitePrix: ratings.length > 0 
              ? ratings.reduce((acc, curr) => acc + curr.criteria.rapportQualitePrix, 0) / ratings.length 
              : 0
          },
          revenueStats: {
            totalRevenue: events.reduce((acc, curr) => acc + (curr.budget || 0), 0),
            averageEventValue: events.length > 0 
              ? events.reduce((acc, curr) => acc + (curr.budget || 0), 0) / events.length 
              : 0
          }
        };

        console.log('Statistiques calculées:', stats);
    
        res.status(200).json({
          success: true,
          data: stats
        });
    } catch (error) {
        console.error('Erreur Backend:', error);
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des statistiques'
        });
    }
};

// Obtenir les informations complètes d'un prestataire
exports.getPrestataireFullInfo = async (req, res) => {
    try {
        const { id } = req.params;
        // console.log('ID reçu dans getPrestataireFullInfo:', id);

        const prestataireSeach = await Prestataire.findOne({ user: id });
        // console.log('PrestataireId trouvé:', prestataireSeach._id);

        // Rechercher le prestataire
        const prestataire = await Prestataire.findById(prestataireSeach._id)
          .maxTimeMS(5000);
        // console.log('Données du prestataire:', prestataire);

        if (!prestataire) {
          return res.status(404).json({
            success: false,
            error: 'Prestataire non trouvé'
          });
        }

        // Rechercher les informations utilisateur associées
        const userData = await User.findById(prestataire.user)
          .select('email name role createdAt')
          .maxTimeMS(5000);
        // console.log('Données utilisateur:', userData);

        if (!userData) {
          return res.status(404).json({
            success: false,
            error: 'Données utilisateur non trouvées'
          });
        }

        // Combiner les informations
        const prestataireFullInfo = {
          // Informations utilisateur
          userInfo: {
            email: userData.email,
            name: userData.name,
            role: userData.role,
            memberSince: userData.createdAt
          },
          // Informations prestataire
          prestataireInfo: {
            company: prestataire.company,
            companyType: prestataire.companyType,
            registrationNumber: prestataire.registrationNumber,
            serviceCategory: prestataire.serviceCategory,
            phone: prestataire.phone,
            language: prestataire.language,
            isActive: prestataire.isActive
          },
          // Statistiques des évaluations
          ratingStats: {
            averageScore: prestataire.ratings.averageScore,
            totalRatings: prestataire.ratings.totalRatings,
            criteriaAverages: prestataire.ratings.criteriaAverages
          },
          // Historique des contacts
          contactHistory: prestataire.contactHistory
        };

        console.log('Informations complètes du prestataire:', prestataireFullInfo);

        res.status(200).json({
          success: true,
          data: prestataireFullInfo
        });

    } catch (error) {
        console.error('Erreur Backend:', error);
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des informations du prestataire'
        });
    }
};