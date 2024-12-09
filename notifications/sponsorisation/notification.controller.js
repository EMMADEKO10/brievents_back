const Notification = require('../../Models/notification.model');
const Pack = require('../../Models/pack.model');
const {User} = require('../../Models/user.model');
const { sendEmail } = require('../../configs/sendEmails');

const createSponsorNotification = async (organizerId, packId, sponsorId, amount) => {
  try {
    const pack = await Pack.findById(packId).populate('event');
    const sponsor = await User.findById(sponsorId);
    const organizer = await User.findById(organizerId);
    
    const notification = new Notification({
      recipient: organizerId,
      type: 'SPONSOR_ADDED',
      message: `Un nouveau sponsor "${sponsor.name}" a contribué ${amount} FCFA pour le pack "${pack.name}" de votre événement "${pack.event.title}"`,
      pack: packId,
      sender: sponsorId
    });
    
    await notification.save();

    // Envoi de l'email à l'organisateur
    await sendEmail(
      organizer.email,
      'Nouveau Sponsor pour votre événement',
      notification.message,
      `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #007BFF;">Nouveau Sponsor</h2>
            <p style="color: #333;">${notification.message}</p>
            <p style="color: #333;">Connectez-vous à votre compte pour plus de détails.</p>
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

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .populate('pack', 'name')
      .populate('sender', 'name');
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndUpdate(notificationId, { read: true });
    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la notification' });
  }
};

const getOrganizerNotifications = async (req, res) => {
  try {
    const { organizerId } = req.params; // Récupérer l'ID de l'organisateur depuis les paramètres de la requête
    const notifications = await Notification.find({ recipient: organizerId })
      .sort({ createdAt: -1 })
      .populate('pack', 'name')
      .populate('sender', 'name')
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications de l\'organisateur' });
  }
};

module.exports = {
  createSponsorNotification,
  getNotifications,
  markAsRead,
  getOrganizerNotifications
}; 