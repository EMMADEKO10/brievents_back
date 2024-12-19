const Event = require("../../Models/event.model");
const { cloudinary, getUploadFolder } = require("../../cloudinary");
const { compressImage, deleteFileWithDelay } = require('../../utils/imageUtils');

// Obtenir tous les événements avec pagination et filtres
const getAllEvents = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, startDate, endDate, search } = req.query;
        const query = {};

        // Appliquer les filtres
        if (status) query.status = status;
        if (startDate && endDate) {
            query.startDate = { $gte: new Date(startDate) };
            query.endDate = { $lte: new Date(endDate) };
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        const events = await Event.find(query)
            .populate('createdBy', 'name email')
            .populate('prestataires', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Event.countDocuments(query);

        res.status(200).json({
            events,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des événements:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const updateEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const updateData = { ...req.body };
        
        // Gestion du logo
        if (req.file) {
            const { newPath, tempPath } = await compressImage(req.file);
            const uploadFolder = getUploadFolder();
            
            const uploadedImage = await cloudinary.uploader.upload(newPath, { 
                folder: uploadFolder,
                quality: "auto:best",
                fetch_format: "auto"
            });
            
            updateData.logo = uploadedImage.secure_url;
            await deleteFileWithDelay(tempPath);
            
            // Supprimer l'ancien logo si nécessaire
            const existingEvent = await Event.findById(eventId);
            if (existingEvent?.logo) {
                const publicId = existingEvent.logo.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
        }

        // Validation des dates
        if (updateData.startDate && updateData.endDate) {
            const startDate = new Date(updateData.startDate);
            const endDate = new Date(updateData.endDate);
            if (endDate < startDate) {
                return res.status(400).json({ 
                    error: "La date de fin ne peut pas être antérieure à la date de début" 
                });
            }
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            updateData,
            { new: true, runValidators: true }
        ).populate('createdBy prestataires');

        if (!updatedEvent) {
            return res.status(404).json({ error: 'Événement non trouvé' });
        }

        return res.status(200).json(updatedEvent);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'événement:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

const changeEventStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['En attente', 'Publié', 'Annulé', 'Terminé'].includes(status)) {
            return res.status(400).json({ error: "Statut invalide" });
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedEvent) {
            return res.status(404).json({ error: "Événement non trouvé" });
        }

        res.status(200).json(updatedEvent);
    } catch (error) {
        console.error("Erreur lors du changement de statut:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const deleteEventById = async (req, res) => {
    try {
        const eventId = req.params.id;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Événement non trouvé' });
        }

        if (event.imageUrl) {
            const publicId = event.imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        await Event.findByIdAndDelete(eventId);

        res.status(200).json({ message: "Événement supprimé avec succès" });
    } catch (error) {
        console.error("Erreur lors de la suppression de l'événement:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const getEventByIdAdmin = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ error: "Événement non trouvé" });
        }

        res.status(200).json(event);
    } catch (error) {
        console.error("Erreur lors de la récupération de l'événement:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

module.exports = {
    getAllEvents,
    updateEvent,
    deleteEventById,
    getEventByIdAdmin,
    changeEventStatus
};
