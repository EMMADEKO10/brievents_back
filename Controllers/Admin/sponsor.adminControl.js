const { Sponsor, PendingSponsor } = require("../../Models/sponsor.model");
const {User, PendingUser} = require("../../Models/user.model");

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
    updateSponsor,
    deleteSponsorById,
    getSponsorByIdAdmin,
    getPendingSponsors,
    validatePendingSponsor
};
