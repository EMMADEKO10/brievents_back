const Notification = require('../../Models/notification.model');
const Event = require('../../Models/event.model');
const {Prestataire} = require('../../Models/prestataire.model');
const { sendEmail } = require('../../configs/sendEmails');
const {User} = require('../../Models/user.model');


// Créer une notification pour un prestataire
exports.createPrestataireNotification = async (prestataireId, eventId, organizerId, type) => {
  try {
    const event = await Event.findById(eventId);
    const prestataire = await Prestataire.findById(prestataireId);
    const user = await User.findById(prestataire.user);
    // console.log('Prestataire trouvé:', prestataire);
    if (!event) {
      throw new Error('Événement non trouvé');
    }

    let message;
    switch (type) {
      case 'ADDED_TO_EVENT':
        message = `Vous avez été ajouté à l'événement "${event.title}"`;
        break;
      case 'REMOVED_FROM_EVENT':
        message = `Vous avez été retiré de l'événement "${event.title}"`;
        break;
      default:
        throw new Error('Type de notification invalide');
    }
    const notification = new Notification({
      recipient: prestataire.user,
      event: eventId,
      sender: organizerId,
      type: type,
      message: message
    });
    await notification.save();
     // Envoi de l'email au prestataire
     await sendEmail(
      user.email,
      'Vous avez été ajouté à un événement',
      notification.message,
      `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #007BFF;">Nouvel Événement</h2>
            <p style="color: #333;">${notification.message}</p>
            <p style="color: #333;">Date de l'événement : ${event.date}</p>
            <p style="color: #333;">Connectez-vous à votre compte pour voir les détails de l'événement.</p>
            <footer style="margin-top: 20px; padding: 10px; text-align: center; background-color: #007BFF; color: white; border-radius: 0 0 8px 8px;">
              <p>Brievent SARL</p>
            </footer>
          </div>
        </div>
      `
    ); 
    return notification;
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    throw error;
  }
};

// Obtenir toutes les notifications d'un prestataire
exports.getPrestataireNotifications = async (req, res) => {
  try {
    const prestataireId = req.params.prestataireId;
    const notifications = await Notification.find({ recipient: prestataireId })
      .populate('event', 'title')
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Marquer une notification comme lue
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 