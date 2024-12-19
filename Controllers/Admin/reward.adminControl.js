const RewardLevel = require("../../Models/rewardLevel.model");
const { PaymentPack } = require("../../Models/paymentPack.model");
const Pack = require("../../Models/pack.model");
const { Sponsor } = require("../../Models/sponsor.model");

// Gestion des niveaux de récompense
const getAllRewardLevels = async (req, res) => {
    try {
        const rewardLevels = await RewardLevel.find().sort({ minPoints: 1 });
        
        // Ajouter le nombre de sponsors par niveau
        const levelsWithStats = await Promise.all(rewardLevels.map(async (level) => {
            const sponsorCount = await Sponsor.countDocuments({
                'currentLevel.name': level.name
            });
            
            return {
                ...level.toObject(),
                sponsorCount,
                nextLevel: level.maxPoints ? await RewardLevel.findOne({
                    minPoints: level.maxPoints + 1
                }).select('name') : null
            };
        }));

        res.status(200).json(levelsWithStats);
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const createRewardLevel = async (req, res) => {
    try {
        const { name, minPoints, maxPoints, benefits, requiresInvitation } = req.body;

        // Vérifier si le niveau existe déjà
        const existingLevel = await RewardLevel.findOne({ name });
        if (existingLevel) {
            return res.status(400).json({ error: "Ce niveau existe déjà" });
        }

        // Vérifier le chevauchement des points
        const overlapping = await RewardLevel.findOne({
            $or: [
                { minPoints: { $lte: minPoints }, maxPoints: { $gte: minPoints } },
                { minPoints: { $lte: maxPoints }, maxPoints: { $gte: maxPoints } }
            ]
        });

        if (overlapping) {
            return res.status(400).json({ 
                error: "Chevauchement avec un niveau existant" 
            });
        }

        const newLevel = new RewardLevel({
            name,
            minPoints,
            maxPoints,
            benefits,
            requiresInvitation
        });

        await newLevel.save();
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

        // Vérifier si les modifications affectent les sponsors existants
        const currentLevel = await RewardLevel.findById(id);
        if (!currentLevel) {
            return res.status(404).json({ error: "Niveau non trouvé" });
        }

        // Si les points changent, vérifier les sponsors affectés
        if (updates.minPoints !== currentLevel.minPoints || 
            updates.maxPoints !== currentLevel.maxPoints) {
            const affectedSponsors = await Sponsor.find({
                'currentLevel.name': currentLevel.name
            });

            // Notifier des changements si nécessaire
            if (affectedSponsors.length > 0) {
                // Logique de notification ici
                console.log(`${affectedSponsors.length} sponsors seront affectés`);
            }
        }

        const updatedLevel = await RewardLevel.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedLevel);
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const deleteRewardLevel = async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier si des sponsors utilisent ce niveau
        const sponsorsWithLevel = await Sponsor.countDocuments({
            'currentLevel._id': id
        });

        if (sponsorsWithLevel > 0) {
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

// Gestion avancée des paiements
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
                    maxAmount: { $max: "$amount" },
                    minAmount: { $min: "$amount" }
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
                    count: { $sum: 1 },
                    averageAmount: { $avg: "$amount" }
                }
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } }
        ]);

        // Statistiques par pack
        const packStats = await PaymentPack.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$pack",
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "packs",
                    localField: "_id",
                    foreignField: "_id",
                    as: "packDetails"
                }
            }
        ]);

        res.status(200).json({
            globalStats: stats[0] || {
                totalAmount: 0,
                totalPayments: 0,
                averageAmount: 0,
                maxAmount: 0,
                minAmount: 0
            },
            monthlyStats,
            packStats
        });
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

// Gestion des paiements de packs
const getPaymentPacksList = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, startDate, endDate } = req.query;
        const query = {};

        if (status) query.status = status;
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const payments = await PaymentPack.find(query)
            .populate('user', 'name email')
            .populate({
                path: 'pack',
                populate: {
                    path: 'event',
                    select: 'title'
                }
            })
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
        console.error("Erreur lors de la récupération des paiements:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const updatePaymentPackStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const payment = await PaymentPack.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('user pack');

        if (!payment) {
            return res.status(404).json({ error: "Paiement non trouvé" });
        }

        // Mettre à jour le nombre de sponsors si le statut change
        if (status === 'completed' && payment.pack) {
            await Pack.findByIdAndUpdate(
                payment.pack._id,
                { $inc: { currentSponsors: 1 } }
            );
        }

        res.status(200).json(payment);
    } catch (error) {
        console.error("Erreur lors de la mise à jour du statut:", error);
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