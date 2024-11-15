const crypto = require('crypto');
const { PendingOrganizer, Organizer } = require('../Models/organizer.model');
const { PendingUser, User } = require('../Models/user.model');
const { sendEmail } = require('../configs/sendEmails');

// Création d’un Organizer en attente
exports.createPendingOrganizer = async (req, res) => {
  const { name, lastName, company, email, phone, language, password } = req.body;

  // Création d’un token de validation
  const validationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiration = Date.now() + 3600000; // 1 heure

  try {
    // Création de l'utilisateur en attente
    const pendingUser = new PendingUser({ email, password, validationToken, tokenExpiration });
    await pendingUser.save();

    // Création du Organizer en attente lié à l'utilisateur
    const pendingOrganizer = new PendingOrganizer({
      name, lastName, company, email, phone, language,
      validationToken, tokenExpiration
    });
    await pendingOrganizer.save();

    // Lien de confirmation
    const confirmationUrl = `${process.env.FRONTEND_URL}/organizer/confirm/${validationToken}`;

    // Envoi de l'email de confirmation
    await sendEmail(
      email,
      'Confirmation de votre inscription',
      `Merci de vous inscrire. Cliquez sur le lien pour confirmer : ${confirmationUrl}`,
      `<p>Merci de vous inscrire. Cliquez sur le lien pour confirmer : <a href="${confirmationUrl}">Confirmer l'inscription</a></p>`
    );

    res.status(201).json({ message: 'Inscription en attente, veuillez vérifier votre email.' });
  } catch (error) {
    console.error('Erreur Backend:', error); // Log d'erreur pour débogage
    res.status(500).json({ error: 'Erreur lors de l’inscription' });
  }
};

// Confirmation d’inscription pour les Organizers et les utilisateurs
exports.confirmOrganizer = async (req, res) => {
    const { token } = req.params;
    
    try {
      // Ajout d'un verrou de validation avec findOneAndUpdate
      const pendingUser = await PendingUser.findOneAndUpdate(
        { 
          validationToken: token, 
          tokenExpiration: { $gt: Date.now() },
          isValidating: { $ne: true }
        },
        { $set: { isValidating: true } },
        { new: true }
      );
  
      if (!pendingUser) {
        // Vérifie si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email: pendingUser?.email });
        if (existingUser) {
          return res.status(200).json({ 
            success: true,
            message: 'Compte déjà confirmé.' 
          });
        }
        return res.status(400).json({ 
          success: false,
          error: 'Token invalide ou expiré' 
        });
      }
      console.log(pendingUser);

      // Création de l'utilisateur avec le rôle organizer
      const pendingOrganizer = await PendingOrganizer.findOne({ validationToken: token });

      console.log("voici organizerName",organizerName);
      console.log("voici organizerName.name",organizerName.name);
      const user = new User({
        email: pendingUser.email,
        password: pendingUser.password,
        name: pendingOrganizer.name,
        role: 'organizer'  // Modification ici pour définir le rôle
      });
      await user.save();
  
      // Vérification du Organizer en attente
      if (pendingOrganizer) {
        const organizer = new Organizer({
          user: user._id,
          company: pendingOrganizer.company,
          language: pendingOrganizer.language
        });
        await organizer.save();
      }
  
      // Suppression des données temporaires
      await pendingUser.deleteOne();
      if (pendingOrganizer) {
        await pendingOrganizer.deleteOne();
      }
  
      res.status(200).json({ 
        success: true,
        message: 'Inscription confirmée avec succès.' 
      });
  
    } catch (error) {
      console.error('Erreur Backend:', error);
      
      // En cas d'erreur, on retire le verrou de validation
      if (token) {
        await PendingUser.findOneAndUpdate(
          { validationToken: token },
          { $set: { isValidating: false } }
        ).catch(console.error);
      }
  
      res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la confirmation.' 
      });
    }
  };