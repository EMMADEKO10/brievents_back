const crypto = require('crypto');
const { PendingSponsor, Sponsor } = require('../Models/sponsor.model');
const { PendingUser, User } = require('../Models/user.model');
const { sendEmail } = require('../configs/sendEmails');
const { PaymentPack } = require('../Models/paymentPack.model');
const Pack = require('../Models/pack.model');
const mongoose = require('mongoose');

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

// ---------------------------------------------------------------------------------------------------------

exports.getSponsorPacks = async (req, res) => {
  const { sponsorId } = req.params;

  try {
    // Récupérer d'abord le sponsor pour avoir l'ID de l'utilisateur associé
    const userIfSponsor = await User.findById(sponsorId);
    console.log(`User trouvé:`, userIfSponsor);
    
    // Correction ici : recherche du sponsor avec le bon format de requête
    const sponsor = await Sponsor.findOne({ user: userIfSponsor._id });
    console.log(`Sponsor trouvé:`, sponsor);
    
    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor non trouvé'
      });
    }

    const sponsoredPacks = await PaymentPack.find({ user: sponsor.user })
      .populate({
        path: 'pack',
        model: 'Pack',
        populate: {
          path: 'event',
          model: 'Event',
          select: 'title description startDate endDate createdBy',
          populate: {
            path: 'createdBy',
            model: 'User',
            select: 'name email'
          }
        }
      });
    console.log(`Packs sponsorisés:`, sponsoredPacks);
    res.status(200).json({
      success: true,
      data: sponsoredPacks
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des packs sponsorisés'
    });
  }
};

exports.getSponsorStats = async (req, res) => {
  const { sponsorId } = req.params;
  console.log(`Sponsor ID:`, sponsorId);

  try {
    // Récupérer d'abord les PaymentPacks du sponsor
    const paymentPacks = await PaymentPack.find({ user: sponsorId })
      .populate({
        path: 'pack',
        select: 'priority event'
      });

    // Calculer les statistiques manuellement
    const eventIds = new Set();
    let totalInvestment = 0;
    const priorityCount = { 1: 0, 2: 0, 3: 0 };

    paymentPacks.forEach(payment => {
      // Compter les événements uniques
      if (payment.pack && payment.pack.event) {
        eventIds.add(payment.pack.event.toString());
      }

      // Calculer l'investissement total
      totalInvestment += payment.amount || 0;

      // Compter la distribution des priorités
      if (payment.pack && payment.pack.priority) {
        priorityCount[payment.pack.priority] = 
          (priorityCount[payment.pack.priority] || 0) + 1;
      }
    });

    // Formater la distribution des packs
    const packDistribution = Object.entries(priorityCount).map(([priority, count]) => ({
      _id: parseInt(priority),
      count
    }));
    console.log(`Répartition par type de pack:`, packDistribution);

    res.status(200).json({
      success: true,
      stats: {
        totalEventsSponsored: eventIds.size,
        totalInvestment,
        packDistribution,
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// Obtenir le profil du sponsor
exports.getSponsorProfile = async (req, res) => {
  const { sponsorId } = req.params;
  
  try {
    const sponsor = await Sponsor.findOne({ user: sponsorId })
      .populate('user', 'name lastName email');
      
    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: sponsor.user.name,
        lastName: sponsor.user.lastName,
        email: sponsor.user.email,
        company: sponsor.company,
        language: sponsor.language
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
};

// Mettre à jour le profil du sponsor
exports.updateSponsorProfile = async (req, res) => {
  const { sponsorId } = req.params;
  const updates = req.body;
  
  try {
    const sponsor = await Sponsor.findOne({ user: sponsorId });
    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor non trouvé'
      });
    }

    // Mise à jour des informations du sponsor
    sponsor.company = updates.company;
    sponsor.language = updates.language;
    await sponsor.save();

    // Mise à jour des informations de l'utilisateur
    await User.findByIdAndUpdate(sponsorId, {
      name: updates.name,
      lastName: updates.lastName,
      email: updates.email
    });

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
};