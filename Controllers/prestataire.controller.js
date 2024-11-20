// prestataire.controller.js
const crypto = require('crypto');
const { PendingPrestataire, Prestataire } = require('../Models/prestataire.model');
const { PendingUser, User } = require('../Models/user.model');
const { sendEmail } = require('../configs/sendEmails');
const {Rating} = require('../Models/prestataire.model');


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
    const existingUser = await User.findOne({ email }).maxTimeMS(5000); // Ajout timeout
    const existingPendingUser = await PendingUser.findOne({ email }).maxTimeMS(5000);
    
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
    ).maxTimeMS(5000);

    if (!pendingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'Token invalide ou expiré' 
      });
    }

    // Récupérer les informations du prestataire en attente
    const pendingPrestataire = await PendingPrestataire.findOne({ validationToken: token }).maxTimeMS(5000);
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
      ).maxTimeMS(5000).catch(console.error);
    }

    res.status(500).json({ 
      success: false,
      error: 'Une erreur est survenue lors de la confirmation du compte.' 
    });
  }
};

// Obtenir tous les prestataires
exports.getAllPrestataires = async (req, res) => {
  try {
    const prestataires = await Prestataire.find({ isActive: true })
      .populate('user', 'email')
      .select('-__v')
      .maxTimeMS(5000);

    res.status(200).json({
      success: true,
      data: prestataires
    });
  } catch (error) {
    console.error('Erreur Backend:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des prestataires'
    });
  }
};

// Obtenir un prestataire par ID
exports.getPrestataireById = async (req, res) => {
  try {
    const { id } = req.params;
    const prestataire = await Prestataire.findById(id)
      .populate('user', 'email')
      .select('-__v')
      .maxTimeMS(5000);

    if (!prestataire) {
      return res.status(404).json({
        success: false,
        error: 'Prestataire non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: prestataire
    });
  } catch (error) {
    console.error('Erreur Backend:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du prestataire'
    });
  }
};

// Obtenir l'historique des contacts d'un prestataire
exports.getPrestataireContacts = async (req, res) => {
  try {
    const { id } = req.params;
    const prestataire = await Prestataire.findById(id)
      .select('contactHistory')
      .maxTimeMS(5000);

    if (!prestataire) {
      return res.status(404).json({
        success: false,
        error: 'Prestataire non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: prestataire.contactHistory || []
    });
  } catch (error) {
    console.error('Erreur Backend:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique des contacts'
    });
  }
};

// Ajouter une évaluation pour un prestataire
exports.addRating = async (req, res) => {
  try {
    console.log('Début de la fonction addRating');
    const prestataireId = req.params.id;
    const { organizer, event, score, comment, criteria, nameOrganizer } = req.body;
    console.log('Données reçues:', { prestataireId, organizer, event, score, comment, criteria, nameOrganizer });

    // Validation des données requises
    if (!prestataireId || !organizer || !event || !score || !criteria) {
      console.log('Validation échouée - données manquantes');
      return res.status(400).json({
        success: false,
        error: 'Toutes les informations requises doivent être fournies'
      });
    }

    // Vérifier que le prestataire existe
    const prestataire = await Prestataire.findById(prestataireId);
    console.log('Recherche du prestataire:', prestataire ? 'trouvé' : 'non trouvé');
    if (!prestataire) {
      return res.status(404).json({
        success: false,
        error: 'Prestataire non trouvé'
      });
    }

    // Créer la nouvelle évaluation
    const newRating = new Rating({
      organizer,
      prestataire: prestataireId,
      event,
      score,
      comment,
      criteria
    });
    console.log('Nouvelle évaluation créée:', newRating);

    // Sauvegarder l'évaluation
    await newRating.save();
    console.log('Évaluation sauvegardée avec succès');

    // Mettre à jour les moyennes des critères du prestataire
    const allRatings = await Rating.find({ prestataire: prestataireId });
    console.log('Nombre total d\'évaluations:', allRatings.length);
    
    const totalRatings = allRatings.length;
    const averageScore = allRatings.reduce((acc, curr) => acc + curr.score, 0) / totalRatings;
    console.log('Score moyen calculé:', averageScore);
    
    // Calculer les moyennes pour chaque critère
    const criteriaAverages = {
      professionnalisme: allRatings.reduce((acc, curr) => acc + curr.criteria.professionnalisme, 0) / totalRatings,
      communication: allRatings.reduce((acc, curr) => acc + curr.criteria.communication, 0) / totalRatings,
      qualiteService: allRatings.reduce((acc, curr) => acc + curr.criteria.qualiteService, 0) / totalRatings,
      rapportQualitePrix: allRatings.reduce((acc, curr) => acc + curr.criteria.rapportQualitePrix, 0) / totalRatings
    };
    console.log('Moyennes des critères calculées:', criteriaAverages);

    // Mettre à jour le prestataire avec les nouvelles moyennes
    await Prestataire.findByIdAndUpdate(prestataireId, {
      $push: {
        contactHistory: {
          _id: event, // Utiliser l'ID de l'événement comme identifiant unique
          organizer: {
            _id: organizer,
            company: nameOrganizer || '',
            contactDate: new Date().toISOString()
          },
          rating: {
            score: score,
            comment: comment || ''
          }
        }
      },
      'ratings.averageScore': averageScore,
      'ratings.totalRatings': totalRatings,
      'ratings.criteriaAverages': criteriaAverages
    });
    console.log('Prestataire mis à jour avec les nouvelles moyennes et l\'historique des contacts');

    res.status(201).json({
      success: true,
      data: newRating
    });

  } catch (error) {
    console.error('Erreur Backend:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'ajout de l\'évaluation'
    });
  }
};

