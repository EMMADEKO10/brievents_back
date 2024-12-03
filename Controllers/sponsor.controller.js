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

  try {
    // Récupérer le sponsor
    const sponsor = await Sponsor.findOne({ user: sponsorId });
    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor non trouvé'
      });
    }

    // Récupérer tous les packs payés par le sponsor avec leurs détails
    const paymentPacks = await PaymentPack.find({ user: sponsorId })
      .populate({
        path: 'pack',
        model: 'Pack',
        select: 'name priority price maxSponsors currentSponsors benefits event isActive',
        populate: {
          path: 'event',
          model: 'Event',
          select: 'title startDate endDate'
        }
      })
      .sort({ createdAt: -1 }); // Trier par date décroissante

    // Initialiser les statistiques
    const stats = {
      totalInvestment: 0,
      activeEvents: 0,
      completedEvents: 0,
      totalEventsSponsored: 0,
      packDistribution: [
        { _id: 1, count: 0, label: "Bronze", totalValue: 0 },
        { _id: 2, count: 0, label: "Silver", totalValue: 0 },
        { _id: 3, count: 0, label: "Gold", totalValue: 0 }
      ],
      monthlyStats: {},
      benefitsUtilization: 0
    };

    const currentDate = new Date();

    paymentPacks.forEach(payment => {
      if (payment.pack && payment.pack.isActive) {
        // Calcul de l'investissement total
        stats.totalInvestment += payment.amount;

        // Distribution des packs
        const packIndex = stats.packDistribution.findIndex(p => p._id === payment.pack.priority);
        if (packIndex !== -1) {
          stats.packDistribution[packIndex].count += 1;
          stats.packDistribution[packIndex].totalValue += payment.amount;
        }

        // Comptage des événements actifs/complétés
        if (payment.pack.event) {
          const eventEndDate = new Date(payment.pack.event.endDate);
          if (eventEndDate > currentDate) {
            stats.activeEvents += 1;
          } else {
            stats.completedEvents += 1;
          }
        }

        // Statistiques mensuelles
        const paymentMonth = payment.createdAt.toISOString().slice(0, 7);
        if (!stats.monthlyStats[paymentMonth]) {
          stats.monthlyStats[paymentMonth] = {
            investment: 0,
            count: 0
          };
        }
        stats.monthlyStats[paymentMonth].investment += payment.amount;
        stats.monthlyStats[paymentMonth].count += 1;

        // Incrémenter le nombre total d'événements sponsorisés
        stats.totalEventsSponsored++;
      }
    });

    // Calcul du taux d'utilisation des avantages
    const totalPacks = paymentPacks.length;
    const activePacks = paymentPacks.filter(p => p.pack && p.pack.isActive).length;
    stats.benefitsUtilization = totalPacks > 0 ? (activePacks / totalPacks) * 100 : 0;

    // Calcul de la croissance mensuelle
    const calculateMonthlyGrowth = (paymentPacks) => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Filtrer les paiements du mois en cours
      const currentMonthPayments = paymentPacks.filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear;
      });

      // Filtrer les paiements du mois précédent
      const lastMonthPayments = paymentPacks.filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate.getMonth() === (currentMonth - 1 < 0 ? 11 : currentMonth - 1) && 
               paymentDate.getFullYear() === (currentMonth === 0 ? currentYear - 1 : currentYear);
      });

      // Calculer les totaux
      const currentMonthTotal = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const lastMonthTotal = lastMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);

      // Calculer le taux de croissance
      let growthRate = 0;
      if (lastMonthTotal > 0) {
        growthRate = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
      } else if (currentMonthTotal > 0) {
        growthRate = 100; // Si pas de dépenses le mois dernier mais des dépenses ce mois-ci
      }

      return {
        growthRate: Math.round(growthRate * 10) / 10,
        currentMonthTotal,
        lastMonthTotal
      };
    };

    // Dans la préparation de la réponse
    const growthData = calculateMonthlyGrowth(paymentPacks);

    const response = {
      stats: {
        totalInvestment: Math.round(stats.totalInvestment),
        activeEvents: stats.activeEvents,
        completedEvents: stats.completedEvents,
        totalEventsSponsored: stats.activeEvents + stats.completedEvents,
        packDistribution: stats.packDistribution.map(pack => ({
          ...pack,
          percentage: totalPacks > 0 ? (pack.count / totalPacks) * 100 : 0
        })),
        growthRate: growthData.growthRate,
        benefitsUtilization: Math.round(stats.benefitsUtilization),
        recentActivity: paymentPacks.slice(0, 5).map(payment => ({
          date: payment.createdAt,
          eventName: payment.pack?.event?.title || 'N/A',
          packName: payment.pack?.name || 'N/A',
          amount: payment.amount,
          priority: payment.pack?.priority || 0
        })),
        monthlyData: {
          current: growthData.currentMonthTotal,
          previous: growthData.lastMonthTotal
        }
      }
    };

    res.status(200).json({
      success: true,
      ...response
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

// Obtenir le profil du sponsor
exports.getSponsorProfile = async (req, res) => {
  const { sponsorId } = req.params;
  
  try {
    const sponsor = await Sponsor.findOne({ user: sponsorId })
      .populate('user', 'name lastName email phone');
      
    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: sponsor.user.name || "",
        lastName: sponsor.user.lastName || "",
        email: sponsor.user.email || "",
        phone: sponsor.phone || "",
        company: sponsor.company || "",
        language: sponsor.language || "fr"
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
    // Mise à jour des informations du sponsor
    const sponsor = await Sponsor.findOneAndUpdate(
      { user: sponsorId },
      {
        company: updates.company,
        language: updates.language,
        phone: updates.phone
      },
      { new: true }
    );

    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor non trouvé'
      });
    }

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
    console.error('Erreur de mise à jour:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
};