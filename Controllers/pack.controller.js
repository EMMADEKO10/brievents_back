const Pack = require('../Models/pack.model');
const {PaymentPack} = require('../Models/paymentPack.model');

const packController = {
    // Créer un nouveau pack
    createPack: async (req, res) => {
        console.log("Demande de création d'un nouveau pack avec les données:", req.body);
        try {
            // Validation des données
            const packData = {
                ...req.body,
                deadline: new Date(req.body.deadline),
                priority: parseInt(req.body.priority),
                maxSponsors: parseInt(req.body.availableSpots) // conversion du nom du champ
            };

            const newPack = new Pack(packData);
            const savedPack = await newPack.save();
            console.log("Pack créé avec succès:", savedPack);
            res.status(201).json(savedPack);
        } catch (err) {
            console.error("Erreur lors de la création du pack:", err);
            res.status(500).json({ 
                message: "Erreur lors de la création du pack",
                error: err.message 
            });
        }
    },

    // Obtenir tous les packs
    getAllPacks: async (req, res) => {
        try {
            const packs = await Pack.find().populate('event');
            res.status(200).json(packs);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    // Obtenir les packs d'un événement spécifique
    getPacksByEvent: async (req, res) => {
        try {
            const packs = await Pack.find({ event: req.params.eventId });
            res.status(200).json(packs);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    // Obtenir un pack spécifique
    getPackById: async (req, res) => {
        try {
            const pack = await Pack.findById(req.params.id).populate('event');
            if (!pack) return res.status(404).json({ message: "Pack non trouvé" });
            res.status(200).json(pack);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    // Mettre à jour un pack
    updatePack: async (req, res) => {
        try {
            const updatedPack = await Pack.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );
            if (!updatedPack) return res.status(404).json({ message: "Pack non trouvé" });
            res.status(200).json(updatedPack);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    // Supprimer un pack
    deletePack: async (req, res) => {
        try {
            const pack = await Pack.findByIdAndDelete(req.params.id);
            if (!pack) return res.status(404).json({ message: "Pack non trouvé" });
            res.status(200).json({ message: "Pack supprimé avec succès" });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    getPackSponsors: async (req, res) => {
        try {
            const { packId } = req.params;
            // Récupérer tous les paiements pour ce pack avec les informations des utilisateurs
            const sponsorPayments = await PaymentPack.find({ pack: packId })
                .populate({
                    path: 'user',
                    select: 'name lastName email',
                    model: 'User'
                })
                .sort({ createdAt: -1 }) // Trier par date décroissante
                .select('amount createdAt user');
    
            // Formater les données pour le front-end
            const formattedSponsors = sponsorPayments.map(payment => ({
                sponsorName:payment.user.name,
                email: payment.user.email,
                amount: payment.amount,
                sponsoredAt: payment.createdAt
            }));
    
            res.json(formattedSponsors);
        } catch (error) {
            console.error('Erreur lors de la récupération des sponsors:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des sponsors' });
        }
    }
};

module.exports = packController;
