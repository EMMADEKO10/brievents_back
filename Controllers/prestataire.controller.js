// prestataire.controller.js
const crypto = require('crypto');
const { PendingPrestataire, Prestataire } = require('../Models/prestataire.model');
const { PendingUser, User } = require('../Models/user.model');
const { sendEmail } = require('../configs/sendEmails');

// Création d'un prestataire en attente
exports.createPendingPrestataire = async (req, res) => {
  const { 
    name, 
    lastName, 
    company,
    companyType,
    registrationNumber,
    serviceCategory,
    email, 
    phone,
    language,
    newsletter,
    password 
  } = req.body;

  // Validation des champs requis
  if (!name || !lastName || !company || !companyType || !registrationNumber || 
      !serviceCategory || !email || !phone || !password) {
    return res.status(400).json({ error: 'Tous les champs requis doivent être remplis' });
  }

  try {
    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    const existingPendingUser = await PendingUser.findOne({ email });
    
    if (existingUser || existingPendingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Création d'un token de validation
    const validationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiration = Date.now() + 3600000; // 1 heure

    // Création de l'utilisateur en attente
    const pendingUser = new PendingUser({ 
      email, 
      password, 
      validationToken, 
      tokenExpiration 
    });
    await pendingUser.save();

    // Création du prestataire en attente
    const pendingPrestataire = new PendingPrestataire({
      name,
      lastName,
      company,
      companyType,
      registrationNumber,
      serviceCategory,
      email,
      phone,
      language: language || 'fr', // Défaut en français
      newsletter: newsletter || false,
      validationToken,
      tokenExpiration
    });
    await pendingPrestataire.save();

    // Construction du lien de confirmation
    const confirmationUrl = `${process.env.FRONTEND_URL}/prestataire/confirm/${validationToken}`;

    // Envoi de l'email de confirmation
    await sendEmail(
      email,
      'Confirmation de votre inscription',
      `Merci de vous être inscrit sur notre plateforme. Pour finaliser votre inscription, veuillez cliquer sur le lien suivant : ${confirmationUrl}`,
      `
        <h2>Bienvenue chez nous !</h2>
        <p>Merci de vous être inscrit sur notre plateforme.</p>
        <p>Pour finaliser votre inscription, veuillez cliquer sur le bouton ci-dessous :</p>
        <a href="${confirmationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0;">
          Confirmer mon inscription
        </a>
        <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller le lien suivant dans votre navigateur :</p>
        <p>${confirmationUrl}</p>
        <p>Ce lien est valable pendant 1 heure.</p>
      `
    );

    res.status(201).json({ 
      success: true,
      message: 'Inscription en attente. Veuillez vérifier votre email pour confirmer votre compte.' 
    });

  } catch (error) {
    console.error('Erreur Backend:', error);
    res.status(500).json({ 
      success: false,
      error: 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.' 
    });
  }
};

// -----------------------------------------------------------------------------------------------

exports.confirmPrestataire = async (req, res) => {
  const { token } = req.params;
   try {
    // Vérifier et verrouiller l'utilisateur en attente
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
      return res.status(400).json({ 
        success: false,
        error: 'Token invalide ou expiré' 
      });
    }

    // Récupérer les informations du prestataire en attente
    const pendingPrestataire = await PendingPrestataire.findOne({ validationToken: token });
    if (!pendingPrestataire) {
      return res.status(400).json({ 
        success: false,
        error: 'Informations prestataire non trouvées' 
      });
    }

    // Créer l'utilisateur final
    const user = new User({
      email: pendingUser.email,
      password: pendingUser.password,
      role: 'prestataire',
      name: pendingPrestataire.name
    });
    await user.save();

    // Créer le prestataire final
    const prestataire = new Prestataire({
      user: user._id,
      name: pendingPrestataire.name,
      lastName: pendingPrestataire.lastName,
      company: pendingPrestataire.company,
      companyType: pendingPrestataire.companyType,
      registrationNumber: pendingPrestataire.registrationNumber,
      serviceCategory: pendingPrestataire.serviceCategory,
      phone: pendingPrestataire.phone,
      newsletter: pendingPrestataire.newsletter,
      language: pendingPrestataire.language
    });
    await prestataire.save();

    // Nettoyer les données temporaires
    await Promise.all([
      pendingUser.deleteOne(),
      pendingPrestataire.deleteOne()
    ]);

    // Envoyer un email de bienvenue
    await sendEmail(
      user.email,
      'Bienvenue sur notre plateforme',
      'Votre compte a été confirmé avec succès. Vous pouvez maintenant vous connecter.',
      `
        <h2>Bienvenue ${prestataire.name} !</h2>
        <p>Votre compte a été confirmé avec succès.</p>
        <p>Vous pouvez maintenant vous connecter à votre espace prestataire.</p>
        <a href="${process.env.FRONTEND_URL}/login" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0;">
          Se connecter
        </a>
      `
    );

    res.status(200).json({ 
      success: true,
      message: 'Compte confirmé avec succès.' 
    });

  } catch (error) {
    console.error('Erreur Backend:', error);
    
    // En cas d'erreur, retirer le verrou
    if (token) {
      await PendingUser.findOneAndUpdate(
        { validationToken: token },
        { $set: { isValidating: false } }
      ).catch(console.error);
    }

    res.status(500).json({ 
      success: false,
      error: 'Une erreur est survenue lors de la confirmation du compte.' 
    });
  }
};