const RewardLevel = require("../../Models/rewardLevel.model");
const { PaymentPack } = require("../../Models/paymentPack.model");
const Pack = require("../../Models/pack.model");
const { Sponsor } = require("../../Models/sponsor.model");
const mongoose = require('mongoose');

// Gestion des niveaux de récompense
const getAllRewardLevels = async (req, res) => {
    try {
        const rewardLevels = await RewardLevel.find().sort({ minPoints: 1 });
        
        const levelsWithStats = await Promise.all(rewardLevels.map(async (level) => {
            const sponsorCount = await Sponsor.countDocuments({
                'currentLevel.name': level.name
            });

            return {
                ...level.toObject(),
                sponsorCount
            };
        }));

        res.status(200).json({
            levels: levelsWithStats,
            totalSponsors: await Sponsor.countDocuments()
        });
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const createRewardLevel = async (req, res) => {
    try {
        const { name, minPoints, maxPoints, benefits, requiresInvitation } = req.body;

        // Validations
        if (!name || !minPoints || !benefits || !Array.isArray(benefits)) {
            return res.status(400).json({ error: "Données invalides" });
        }

        // Vérifier les chevauchements
        const overlapping = await RewardLevel.findOne({
            $or: [
                { minPoints: { $lte: minPoints }, maxPoints: { $gte: minPoints } },
                { minPoints: { $lte: maxPoints }, maxPoints: { $gte: maxPoints } }
            ]
        });

        if (overlapping) {
            return res.status(400).json({ error: "Chevauchement avec un niveau existant" });
        }

        const newLevel = await RewardLevel.create({
            name,
            minPoints,
            maxPoints,
            benefits,
            requiresInvitation: requiresInvitation || false
        });

        res.status(201).json(newLevel);
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const updateRewardLevel = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updatedLevel = await RewardLevel.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedLevel) {
            return res.status(404).json({ error: "Niveau non trouvé" });
        }

        res.status(200).json(updatedLevel);
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const deleteRewardLevel = async (req, res) => {
    try {
        const { id } = req.params;
        const sponsorsCount = await Sponsor.countDocuments({ 'currentLevel._id': id });

        if (sponsorsCount > 0) {
            return res.status(400).json({ 
                error: "Impossible de supprimer un niveau utilisé par des sponsors" 
            });
        }

        await RewardLevel.findByIdAndDelete(id);
        res.status(200).json({ message: "Niveau supprimé avec succès" });
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

// Gestion des paiements
const getPaymentPacksStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = {};

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const stats = await PaymentPack.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" },
                    totalPayments: { $sum: 1 },
                    averageAmount: { $avg: "$amount" },
                    successfulPayments: {
                        $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                    }
                }
            }
        ]);

        const monthlyStats = await PaymentPack.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } }
        ]);

        res.status(200).json({
            globalStats: stats[0] || {
                totalAmount: 0,
                totalPayments: 0,
                averageAmount: 0,
                successfulPayments: 0
            },
            monthlyStats
        });
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const getPaymentPacksList = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const query = status ? { status } : {};

        const payments = await PaymentPack.find(query)
            .populate('user', 'name email')
            .populate('pack')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await PaymentPack.countDocuments(query);

        res.status(200).json({
            payments,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const updatePaymentPackStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'completed', 'failed'].includes(status)) {
            return res.status(400).json({ error: "Statut invalide" });
        }

        const payment = await PaymentPack.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('user pack');

        if (!payment) {
            return res.status(404).json({ error: "Paiement non trouvé" });
        }

        res.status(200).json(payment);
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

module.exports = {
    getAllRewardLevels,
    createRewardLevel,
    updateRewardLevel,
    deleteRewardLevel,
    getPaymentPacksStats,
    getPaymentPacksList,
    updatePaymentPackStatus
}; 