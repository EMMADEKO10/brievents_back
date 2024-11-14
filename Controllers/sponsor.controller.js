const crypto = require('crypto');
const { PendingSponsor, Sponsor } = require('../Models/sponsor.model');
const { PendingUser, User } = require('../Models/user.model');
const { sendEmail } = require('../configs/sendEmails');

// Création d’un sponsor en attente
exports.createPendingSponsor = async (req, res) => {
  const { name, lastName, company, email, phone, language, password } = req.body;

  // Création d’un token de validation
  const validationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiration = Date.now() + 3600000; // 1 heure

  try {
    // Création de l'utilisateur en attente
    const pendingUser = new PendingUser({ email, password, validationToken, tokenExpiration });
    await pendingUser.save();
    console.log('Utilisateur en attente créé avec succès');

    // Création du sponsor en attente lié à l'utilisateur
    const pendingSponsor = new PendingSponsor({
      name, lastName, company, email, phone, language,
      validationToken, tokenExpiration
    });
    await pendingSponsor.save();
    console.log('Sponsor en attente créé avec succès');

    // Lien de confirmation
    const confirmationUrl = `${process.env.FRONTEND_URL}/confirm/${validationToken}`;

    // Envoi de l'email de confirmation
    await sendEmail(
      email,
      'Confirmation de votre inscription',
      `Merci de vous inscrire. Cliquez sur le lien pour confirmer : ${confirmationUrl}`,
      `<p>Merci de vous inscrire. Cliquez sur le lien pour confirmer : <a href="${confirmationUrl}">Confirmer l'inscription</a></p>`
    );
    console.log('Email de confirmation envoyé avec succès');

    res.status(201).json({ message: 'Inscription en attente, veuillez vérifier votre email.' });
  } catch (error) {
    console.error('Erreur Backend:', error); // Log d'erreur pour débogage
    res.status(500).json({ error: 'Erreur lors de l’inscription' });
  }
};


// Confirmation d’inscription pour les sponsors et les utilisateurs
exports.confirmSponsor = async (req, res) => {
  const { token } = req.params;
  
  try {
    // Ajout d'un verrou de validation avec findOneAndUpdate
    const pendingUser = await PendingUser.findOneAndUpdate(
      { 
        validationToken: token, 
        tokenExpiration: { $gt: Date.now() },
        isValidating: { $ne: true } // Vérifie que le document n'est pas en cours de validation
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
    const pendingSponsor = await PendingSponsor.findOne({ validationToken: token });

    // Création de l'utilisateur
    const user = new User({
      email: pendingUser.email,
      password: pendingUser.password,
      name: pendingSponsor.name
    });
    await user.save();
    console.log('Utilisateur créé avec succès');

    // Vérification du sponsor en attente
    if (pendingSponsor) {
      const sponsor = new Sponsor({
        user: user._id,
        company: pendingSponsor.company,
        language: pendingSponsor.language
      });
      await sponsor.save();
      console.log('Sponsor créé avec succès');
    }

    // Suppression des données temporaires
    await pendingUser.deleteOne();
    if (pendingSponsor) {
      await pendingSponsor.deleteOne();
    console.log('Données pendingSponsor temporaires supprimées avec succès');
    }
    console.log('Données pendingUser temporaires supprimées avec succès');

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