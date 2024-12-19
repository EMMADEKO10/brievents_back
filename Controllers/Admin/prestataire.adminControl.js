const { Prestataire, PendingPrestataire, Rating } = require("../../Models/prestataire.model");
const User = require("../../Models/user.model");
const bcrypt = require('bcrypt');

// Obtenir tous les prestataires avec pagination et filtres
const getAllPrestataires = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search, 
            sortBy = 'createdAt', 
            order = 'desc',
            serviceCategory,
            isActive,
            minRating
        } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { company: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { registrationNumber: { $regex: search, $options: 'i' } }
            ];
        }

        if (serviceCategory) query.serviceCategory = serviceCategory;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (minRating) query['ratings.averageScore'] = { $gte: parseFloat(minRating) };

        const prestataires = await Prestataire.find(query)
            .populate('user', 'email name role')
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Prestataire.countDocuments(query);

        res.status(200).json({
            prestataires,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des prestataires:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const updatePrestataire = async (req, res) => {
    try {
        const prestataireId = req.params.id;
        const {
            name,
            lastName,
            company,
            companyType,
            registrationNumber,
            serviceCategory,
            phone,
            language,
            newsletter,
            isActive,
            email,
            password
        } = req.body;

        // Validation des données
        if (!name || !lastName || !company || !companyType || !registrationNumber || 
            !serviceCategory || !phone || !language) {
            return res.status(400).json({ 
                error: "Tous les champs obligatoires doivent être remplis." 
            });
        }

        const prestataire = await Prestataire.findById(prestataireId).populate('user');
        if (!prestataire) {
            return res.status(404).json({ error: 'Prestataire non trouvé' });
        }

        // Mise à jour des informations de l'utilisateur
        const userUpdateData = {};
        if (email) userUpdateData.email = email;
        if (password) {
            userUpdateData.password = await bcrypt.hash(password, 10);
        }

        if (Object.keys(userUpdateData).length > 0) {
            if (email) {
                const existingUser = await User.findOne({ 
                    email, 
                    _id: { $ne: prestataire.user._id } 
                });
                if (existingUser) {
                    return res.status(400).json({ error: "Cet email est déjà utilisé" });
                }
            }
            await User.findByIdAndUpdate(prestataire.user._id, userUpdateData);
        }

        // Mise à jour des informations du prestataire
        const updatedPrestataire = await Prestataire.findByIdAndUpdate(
            prestataireId,
            {
                name,
                lastName,
                company,
                companyType,
                registrationNumber,
                serviceCategory,
                phone,
                language,
                newsletter: newsletter || false,
                isActive: isActive !== undefined ? isActive : true
            },
            { new: true }
        ).populate('user', '-password');

        res.status(200).json(updatedPrestataire);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du prestataire:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

const deletePrestataireById = async (req, res) => {
    try {
        const prestataireId = req.params.id;

        const prestataire = await Prestataire.findById(prestataireId);
        if (!prestataire) {
            return res.status(404).json({ error: 'Prestataire non trouvé' });
        }

        // Supprimer l'utilisateur associé
        await User.findByIdAndDelete(prestataire.user);
        
        // Supprimer le prestataire
        await Prestataire.findByIdAndDelete(prestataireId);

        res.status(200).json({ message: "Prestataire supprimé avec succès" });
    } catch (error) {
        console.error("Erreur lors de la suppression du prestataire:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const getPrestataireByIdAdmin = async (req, res) => {
    try {
        const prestataireId = req.params.id;
        const prestataire = await Prestataire.findById(prestataireId)
            .populate('user')
            .populate('contactHistory.organizer._id');

        if (!prestataire) {
            return res.status(404).json({ error: "Prestataire non trouvé" });
        }

        res.status(200).json(prestataire);
    } catch (error) {
        console.error("Erreur lors de la récupération du prestataire:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const togglePrestataireStatus = async (req, res) => {
    try {
        const prestataireId = req.params.id;
        const prestataire = await Prestataire.findById(prestataireId);

        if (!prestataire) {
            return res.status(404).json({ error: "Prestataire non trouvé" });
        }

        prestataire.isActive = !prestataire.isActive;
        await prestataire.save();

        res.status(200).json({
            message: `Prestataire ${prestataire.isActive ? 'activé' : 'désactivé'} avec succès`,
            isActive: prestataire.isActive
        });
    } catch (error) {
        console.error("Erreur lors du changement de statut du prestataire:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const getPrestataireStats = async (req, res) => {
    try {
        const prestataireId = req.params.id;
        
        const stats = await Rating.aggregate([
            { $match: { prestataire: prestataireId } },
            {
                $group: {
                    _id: null,
                    totalRatings: { $sum: 1 },
                    averageScore: { $avg: '$score' },
                    averageProfessionnalisme: { $avg: '$criteria.professionnalisme' },
                    averageCommunication: { $avg: '$criteria.communication' },
                    averageQualiteService: { $avg: '$criteria.qualiteService' },
                    averageRapportQualitePrix: { $avg: '$criteria.rapportQualitePrix' }
                }
            }
        ]);

        const recentRatings = await Rating.find({ prestataire: prestataireId })
            .populate('organizer', 'name company')
            .populate('event', 'title')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            statistics: stats[0] || {
                totalRatings: 0,
                averageScore: 0,
                averageProfessionnalisme: 0,
                averageCommunication: 0,
                averageQualiteService: 0,
                averageRapportQualitePrix: 0
            },
            recentRatings
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des statistiques:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

module.exports = {
    getAllPrestataires,
    updatePrestataire,
    deletePrestataireById,
    getPrestataireByIdAdmin,
    togglePrestataireStatus,
    getPrestataireStats
};
