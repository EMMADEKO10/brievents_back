const { Organizer, PendingOrganizer } = require("../../Models/organizer.model");
const User = require("../../Models/user.model");

const updateOrganizer = async (req, res) => {
    try {
        console.log("Début de la mise à jour de l'organisateur");
        const organizerId = req.params.id;
        const {
            company,
            language,
            lastName,
            phone
        } = req.body;

        if (!company || !language || !lastName || !phone) {
            return res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis." });
        }

        const updatedData = {
            company,
            language,
            lastName,
            phone
        };

        const updatedOrganizer = await Organizer.findByIdAndUpdate(
            organizerId,
            updatedData,
            { new: true }
        ).populate('user');

        if (!updatedOrganizer) {
            return res.status(404).json({ error: 'Organisateur non trouvé' });
        }

        return res.status(200).json(updatedOrganizer);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'organisateur:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

const deleteOrganizerById = async (req, res) => {
    try {
        const organizerId = req.params.id;

        const organizer = await Organizer.findById(organizerId);
        if (!organizer) {
            return res.status(404).json({ error: 'Organisateur non trouvé' });
        }

        // Supprimer l'utilisateur associé
        await User.findByIdAndDelete(organizer.user);
        
        // Supprimer l'organisateur
        await Organizer.findByIdAndDelete(organizerId);

        res.status(200).json({ message: "Organisateur supprimé avec succès" });
    } catch (error) {
        console.error("Erreur lors de la suppression de l'organisateur:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const getOrganizerByIdAdmin = async (req, res) => {
    try {
        const organizerId = req.params.id;
        const organizer = await Organizer.findById(organizerId).populate('user');

        if (!organizer) {
            return res.status(404).json({ error: "Organisateur non trouvé" });
        }

        res.status(200).json(organizer);
    } catch (error) {
        console.error("Erreur lors de la récupération de l'organisateur:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const getPendingOrganizers = async (req, res) => {
    try {
        const pendingOrganizers = await PendingOrganizer.find({ isValidating: false });
        res.status(200).json(pendingOrganizers);
    } catch (error) {
        console.error("Erreur lors de la récupération des organisateurs en attente:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const validatePendingOrganizer = async (req, res) => {
    try {
        const pendingOrganizerId = req.params.id;
        const pendingOrganizer = await PendingOrganizer.findById(pendingOrganizerId);

        if (!pendingOrganizer) {
            return res.status(404).json({ error: "Organisateur en attente non trouvé" });
        }

        pendingOrganizer.isValidating = true;
        await pendingOrganizer.save();

        res.status(200).json({ message: "Demande d'organisateur validée avec succès" });
    } catch (error) {
        console.error("Erreur lors de la validation de l'organisateur:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

module.exports = {
    updateOrganizer,
    deleteOrganizerById,
    getOrganizerByIdAdmin,
    getPendingOrganizers,
    validatePendingOrganizer
};
