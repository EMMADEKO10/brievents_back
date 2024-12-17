const Event = require("../../Models/event.model");
const { cloudinary, getUploadFolder } = require("../../cloudinary");
const { compressImage, deleteFileWithDelay } = require('../../utils/imageUtils');

const updateEvent = async (req, res) => {
    try {
        console.log("Début de la mise à jour de l'événement");
        const eventId = req.params.id;
        const {
            title,
            description,
            date,
            location,
            organizer
        } = req.body;

        if (!title || !description || !date || !location || !organizer) {
            return res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis." });
        }

        const compressedFiles = [];
        const tempFiles = [];
        let updatedImageUrl = null;

        if (req.file) {
            const { newPath, tempPath } = await compressImage(req.file);
            compressedFiles.push(newPath);
            tempFiles.push(tempPath);
            updatedImageUrl = newPath;
        }

        const uploadFolder = getUploadFolder();

        let updatedData = {
            title,
            description,
            date,
            location,
            organizer
        };

        const existingEvent = await Event.findById(eventId);

        if (updatedImageUrl) {
            const uploadedImage = await cloudinary.uploader.upload(
                updatedImageUrl,
                { folder: uploadFolder }
            );
            updatedData.imageUrl = uploadedImage.secure_url;

            if (existingEvent && existingEvent.imageUrl) {
                const publicId = existingEvent.imageUrl.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
        }

        const updatedEvent = await Event.findByIdAndUpdate(eventId, updatedData, {
            new: true,
        });

        if (!updatedEvent) {
            return res.status(404).json({ error: 'Événement non trouvé' });
        }

        for (const tempFile of tempFiles) {
            try {
                await deleteFileWithDelay(tempFile);
            } catch (unlinkError) {
                console.warn(`Impossible de supprimer le fichier temporaire: ${tempFile}`, unlinkError);
            }
        }

        return res.status(200).json(updatedEvent);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'événement:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
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
    updateEvent,
    deleteEventById,
    getEventByIdAdmin
};
