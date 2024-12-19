const { Sponsor, PendingSponsor, SponsorLevel } = require("../../Models/sponsor.model");
const { User } = require("../../Models/user.model");
const { PaymentPack } = require("../../Models/paymentPack.model");
const bcrypt = require('bcrypt');

// Obtenir tous les sponsors avec pagination et filtres
const getAllSponsors = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search, 
            sortBy = 'createdAt', 
            order = 'desc',
            level 
        } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { company: { $regex: search, $options: 'i' } },
                { 'user.name': { $regex: search, $options: 'i' } },
                { 'user.email': { $regex: search, $options: 'i' } }
            ];
        }

        if (level) query.currentLevel = level;

        const sponsors = await Sponsor.find(query)
            .populate('user', 'email name')
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Sponsor.countDocuments(query);

        res.status(200).json({
            sponsors,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des sponsors:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const getSponsorStats = async (req, res) => {
    try {
        const sponsorId = req.params.id;
        
        // Récupérer l'historique des paiements
        const paymentHistory = await PaymentPack.find({ 
            user: sponsorId,
            status: 'completed'
        })
        .populate('pack')
        .sort({ createdAt: -1 });

        // Calculer les statistiques
        const stats = {
            totalInvested: paymentHistory.reduce((sum, p) => sum + p.amount, 0),
            totalEvents: paymentHistory.length,
            averageInvestment: paymentHistory.length > 0 ? 
                paymentHistory.reduce((sum, p) => sum + p.amount, 0) / paymentHistory.length : 0,
            recentPayments: paymentHistory.slice(0, 5)
        };

        res.status(200).json(stats);
    } catch (error) {
        console.error("Erreur lors de la récupération des statistiques:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const updateSponsor = async (req, res) => {
    try {
        console.log("Début de la mise à jour du sponsor");
        const sponsorId = req.params.id;
        const {
            company,
            language,
            phone
        } = req.body;

        if (!company || !language) {
            return res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis." });
        }

        const updatedData = {
            company,
            language,
            phone
        };

        const updatedSponsor = await Sponsor.findByIdAndUpdate(
            sponsorId,
            updatedData,
            { new: true }
        ).populate('user');

        if (!updatedSponsor) {
            return res.status(404).json({ error: 'Sponsor non trouvé' });
        }

        return res.status(200).json(updatedSponsor);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du sponsor:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

const deleteSponsorById = async (req, res) => {
    try {
        const sponsorId = req.params.id;

        const sponsor = await Sponsor.findById(sponsorId);
        if (!sponsor) {
            return res.status(404).json({ error: 'Sponsor non trouvé' });
        }

        // Supprimer l'utilisateur associé
        await User.findByIdAndDelete(sponsor.user);
        
        // Supprimer le sponsor
        await Sponsor.findByIdAndDelete(sponsorId);

        res.status(200).json({ message: "Sponsor supprimé avec succès" });
    } catch (error) {
        console.error("Erreur lors de la suppression du sponsor:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const getSponsorByIdAdmin = async (req, res) => {
    try {
        const sponsorId = req.params.id;
        const sponsor = await Sponsor.findById(sponsorId).populate('user');

        if (!sponsor) {
            return res.status(404).json({ error: "Sponsor non trouvé" });
        }

        res.status(200).json(sponsor);
    } catch (error) {
        console.error("Erreur lors de la récupération du sponsor:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const getPendingSponsors = async (req, res) => {
    try {
        const pendingSponsors = await PendingSponsor.find({ isValidating: false });
        res.status(200).json(pendingSponsors);
    } catch (error) {
        console.error("Erreur lors de la récupération des sponsors en attente:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const validatePendingSponsor = async (req, res) => {
    try {
        const pendingSponsorId = req.params.id;
        const pendingSponsor = await PendingSponsor.findById(pendingSponsorId);

        if (!pendingSponsor) {
            return res.status(404).json({ error: "Sponsor en attente non trouvé" });
        }

        pendingSponsor.isValidating = true;
        await pendingSponsor.save();

        res.status(200).json({ message: "Demande de sponsor validée avec succès" });
    } catch (error) {
        console.error("Erreur lors de la validation du sponsor:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

module.exports = {
    getAllSponsors,
    updateSponsor,
    deleteSponsorById,
    getSponsorByIdAdmin,
    getPendingSponsors,
    validatePendingSponsor,
    getSponsorStats
};
