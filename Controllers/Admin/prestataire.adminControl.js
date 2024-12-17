const { Prestataire, PendingPrestataire } = require("../../Models/prestataire.model");
const User = require("../../Models/user.model");

const updatePrestataire = async (req, res) => {
    try {
        console.log("Début de la mise à jour du prestataire");
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
            isActive
        } = req.body;

        if (!name || !lastName || !company || !companyType || !registrationNumber || 
            !serviceCategory || !phone || !language) {
            return res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis." });
        }

        // Vérification du type d'entreprise
        const validCompanyTypes = ['sarl', 'sa', 'sas', 'scs', 'snc'];
        if (!validCompanyTypes.includes(companyType)) {
            return res.status(400).json({ error: "Type d'entreprise invalide" });
        }

        const updatedData = {
            name,
            lastName,
            company,
            companyType,
            registrationNumber,
            serviceCategory,
            phone,
            language,
            newsletter: newsletter || false,
            isActive: isActive || true
        };

        const updatedPrestataire = await Prestataire.findByIdAndUpdate(
            prestataireId,
            updatedData,
            { new: true }
        ).populate('user');

        if (!updatedPrestataire) {
            return res.status(404).json({ error: 'Prestataire non trouvé' });
        }

        return res.status(200).json(updatedPrestataire);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du prestataire:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
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

module.exports = {
    updatePrestataire,
    deletePrestataireById,
    getPrestataireByIdAdmin,
    togglePrestataireStatus
};
