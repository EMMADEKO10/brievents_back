const { User, PendingUser } = require("../../Models/user.model");
const bcrypt = require('bcrypt');

const updateUser = async (req, res) => {
    try {
        console.log("Début de la mise à jour de l'utilisateur");
        const userId = req.params.id;
        const {
            email,
            name,
            role,
            password
        } = req.body;

        if (!email || !name || !role) {
            return res.status(400).json({ error: "Les champs email, nom et rôle sont obligatoires." });
        }

        const updatedData = {
            email,
            name,
            role
        };

        // Si un nouveau mot de passe est fourni, le hasher
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updatedData.password = hashedPassword;
        }

        // Vérifier si l'email existe déjà pour un autre utilisateur
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(400).json({ error: "Cet email est déjà utilisé" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updatedData,
            { new: true }
        ).select('-password'); // Exclure le mot de passe de la réponse

        if (!updatedUser) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        return res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

const deleteUserById = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
        console.error("Erreur lors de la suppression de l'utilisateur:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const getUserByIdAdmin = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const getPendingUsers = async (req, res) => {
    try {
        const pendingUsers = await PendingUser.find().select('-password');
        res.status(200).json(pendingUsers);
    } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs en attente:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const changeUserRole = async (req, res) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({ error: "Le rôle est requis" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Erreur lors du changement de rôle:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

module.exports = {
    updateUser,
    deleteUserById,
    getUserByIdAdmin,
    getPendingUsers,
    changeUserRole
};
