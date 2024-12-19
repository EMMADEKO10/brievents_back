const { Organizer, PendingOrganizer } = require("../../Models/organizer.model");
const User = require("../../Models/user.model");
const bcrypt = require('bcrypt');

// Obtenir tous les organisateurs avec pagination et filtres
const getAllOrganizers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, sortBy = 'createdAt', order = 'desc' } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { company: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const organizers = await Organizer.find(query)
            .populate('user', 'email name role')
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Organizer.countDocuments(query);

        res.status(200).json({
            organizers,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des organisateurs:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const updateOrganizer = async (req, res) => {
    try {
        const organizerId = req.params.id;
        const {
            company,
            language,
            lastName,
            phone,
            email,
            name,
            password
        } = req.body;

        // Validation des données
        if (!company || !language || !lastName || !phone) {
            return res.status(400).json({ 
                error: "Les champs company, language, lastName et phone sont obligatoires." 
            });
        }

        const organizer = await Organizer.findById(organizerId).populate('user');
        if (!organizer) {
            return res.status(404).json({ error: 'Organisateur non trouvé' });
        }

        // Mise à jour des informations de l'utilisateur
        const userUpdateData = {};
        if (email) userUpdateData.email = email;
        if (name) userUpdateData.name = name;
        if (password) {
            userUpdateData.password = await bcrypt.hash(password, 10);
        }

        if (Object.keys(userUpdateData).length > 0) {
            if (email) {
                const existingUser = await User.findOne({ 
                    email, 
                    _id: { $ne: organizer.user._id } 
                });
                if (existingUser) {
                    return res.status(400).json({ error: "Cet email est déjà utilisé" });
                }
            }
            await User.findByIdAndUpdate(organizer.user._id, userUpdateData);
        }

        // Mise à jour des informations de l'organisateur
        const updatedOrganizer = await Organizer.findByIdAndUpdate(
            organizerId,
            { company, language, lastName, phone },
            { new: true }
        ).populate('user');

        res.status(200).json(updatedOrganizer);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'organisateur:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

const deleteOrganizerById = async (req, res) => {
    try {
        const organizerId = req.params.id;
        const organizer = await Organizer.findById(organizerId);

        if (!organizer) {
            return res.status(404).json({ error: 'Organisateur non trouvé' });
        }

        // Supprimer l'utilisateur associé et l'organisateur
        await Promise.all([
            User.findByIdAndDelete(organizer.user),
            Organizer.findByIdAndDelete(organizerId)
        ]);

        res.status(200).json({ message: "Organisateur supprimé avec succès" });
    } catch (error) {
        console.error("Erreur lors de la suppression de l'organisateur:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const getOrganizerByIdAdmin = async (req, res) => {
    try {
        const organizerId = req.params.id;
        const organizer = await Organizer.findById(organizerId)
            .populate('user', '-password');

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
        const { page = 1, limit = 10 } = req.query;
        
        const pendingOrganizers = await PendingOrganizer.find({ isValidating: false })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await PendingOrganizer.countDocuments({ isValidating: false });

        res.status(200).json({
            pendingOrganizers,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des organisateurs en attente:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const validatePendingOrganizer = async (req, res) => {
    try {
        const pendingOrganizerId = req.params.id;
        const { approved } = req.body;

        const pendingOrganizer = await PendingOrganizer.findById(pendingOrganizerId);
        if (!pendingOrganizer) {
            return res.status(404).json({ error: "Organisateur en attente non trouvé" });
        }

        if (approved) {
            // Créer un nouvel utilisateur
            const hashedPassword = await bcrypt.hash(pendingOrganizer.password, 10);
            const user = new User({
                email: pendingOrganizer.email,
                password: hashedPassword,
                name: pendingOrganizer.name,
                role: 'organizer'
            });
            await user.save();

            // Créer un nouvel organisateur
            const organizer = new Organizer({
                user: user._id,
                company: pendingOrganizer.company,
                language: pendingOrganizer.language,
                lastName: pendingOrganizer.lastName,
                phone: pendingOrganizer.phone
            });
            await organizer.save();
        }

        // Supprimer la demande en attente
        await PendingOrganizer.findByIdAndDelete(pendingOrganizerId);

        res.status(200).json({ 
            message: approved ? 
                "Organisateur validé et créé avec succès" : 
                "Demande d'organisateur rejetée"
        });
    } catch (error) {
        console.error("Erreur lors de la validation de l'organisateur:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

module.exports = {
    getAllOrganizers,
    updateOrganizer,
    deleteOrganizerById,
    getOrganizerByIdAdmin,
    getPendingOrganizers,
    validatePendingOrganizer
};
