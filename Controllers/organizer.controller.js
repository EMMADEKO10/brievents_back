const crypto = require('crypto');
const { PendingOrganizer, Organizer } = require('../Models/organizer.model');
const { PendingUser, User } = require('../Models/user.model');
const { sendEmail } = require('../configs/sendEmails');
const Event = require("../Models/event.model")
const Pack = require("../Models/pack.model")
const { PaymentPack } = require("../Models/paymentPack.model")

// Création d’un Organizer en attente
exports.createPendingOrganizer = async (req, res) => {
  const { name, lastName, company, email, phone, language, password } = req.body

  // Création d’un token de validation
  const validationToken = crypto.randomBytes(32).toString("hex")
  const tokenExpiration = Date.now() + 3600000 // 1 heure

  try {
    // Création de l'utilisateur en attente
    const pendingUser = new PendingUser({
      email,
      password,
      validationToken,
      tokenExpiration,
    })
    await pendingUser.save()

    // Création du Organizer en attente lié à l'utilisateur
    const pendingOrganizer = new PendingOrganizer({
      name,
      lastName,
      company,
      email,
      phone,
      language,
      validationToken,
      tokenExpiration,
    })
    await pendingOrganizer.save()

    // Lien de confirmation
    const confirmationUrl = `${process.env.FRONTEND_URL}/organizer/confirm/${validationToken}`

    // Envoi de l'email de confirmation
    await sendEmail(
      email,
      "Confirmation de votre inscription",
      `Merci de vous inscrire. Cliquez sur le lien pour confirmer : ${confirmationUrl}`,
      `<p>Merci de vous inscrire. Cliquez sur le lien pour confirmer : <a href="${confirmationUrl}">Confirmer l'inscription</a></p>`
    )

    res.status(201).json({
      message: "Inscription en attente, veuillez vérifier votre email.",
    })
  } catch (error) {
    console.error("Erreur Backend:", error) // Log d'erreur pour débogage
    res.status(500).json({ error: "Erreur lors de l’inscription" })
  }
}

// Confirmation d’inscription pour les Organizers et les utilisateurs
exports.confirmOrganizer = async (req, res) => {
  const { token } = req.params

  try {
    // Ajout d'un verrou de validation avec findOneAndUpdate
    const pendingUser = await PendingUser.findOneAndUpdate(
      {
        validationToken: token,
        tokenExpiration: { $gt: Date.now() },
        isValidating: { $ne: true },
      },
      { $set: { isValidating: true } },
      { new: true }
    )

    if (!pendingUser) {
      // Vérifie si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email: pendingUser?.email })
      if (existingUser) {
        return res.status(200).json({
          success: true,
          message: "Compte déjà confirmé.",
        })
      }
      return res.status(400).json({
        success: false,
        error: "Token invalide ou expiré",
      })
    }
    console.log(pendingUser)

    // Création de l'utilisateur avec le rôle organizer
    const pendingOrganizer = await PendingOrganizer.findOne({
      validationToken: token,
    })

    console.log("voici organizerName", organizerName)
    console.log("voici organizerName.name", organizerName.name)
    const user = new User({
      email: pendingUser.email,
      password: pendingUser.password,
      name: pendingOrganizer.name,
      role: "organizer", // Modification ici pour définir le rôle
    })
    await user.save()

    // Vérification du Organizer en attente
    if (pendingOrganizer) {
      const organizer = new Organizer({
        user: user._id,
        company: pendingOrganizer.company,
        language: pendingOrganizer.language,
      })
      await organizer.save()
    }

    // Suppression des données temporaires
    await pendingUser.deleteOne()
    if (pendingOrganizer) {
      await pendingOrganizer.deleteOne()
    }

    res.status(200).json({
      success: true,
      message: "Inscription confirmée avec succès.",
    })
  } catch (error) {
    console.error("Erreur Backend:", error)

    // En cas d'erreur, on retire le verrou de validation
    if (token) {
      await PendingUser.findOneAndUpdate(
        { validationToken: token },
        { $set: { isValidating: false } }
      ).catch(console.error)
    }

    res.status(500).json({
      success: false,
      error: "Erreur lors de la confirmation.",
    })
  }
}

// Fonction pour calculer le taux d'engagement
const calculateEngagementRate = (events) => {
  if (!events || events.length === 0) return 0

  let totalEngagement = 0
  let totalEvents = events.length

  events.forEach((event) => {
    // Calcul basé sur le nombre de participants par rapport à la capacité maximale
    const participantsCount = event.participants?.length || 0
    const maxCapacity = event.maxCapacity || 100 // Valeur par défaut si non définie
    const eventEngagement = (participantsCount / maxCapacity) * 100
    totalEngagement += eventEngagement
  })

  // Retourne la moyenne d'engagement en pourcentage
  return Math.round(totalEngagement / totalEvents)
}

exports.getDashboardData = async (req, res) => {
  try {
    const { userId } = req.params
    console.log("userId reçu:", userId)

    // Récupérer les données de l'organisateur
    const organizer = await Organizer.findOne({ user: userId })
    // .populate('events')
    // .populate('messages')
    // .populate('tasks');

    console.log("Données organizer trouvées:", organizer)

    if (!organizer) {
      console.log("Aucun organizer trouvé pour userId:", userId)
      return res.status(404).json({ error: "Organisateur non trouvé" })
    }

    // Formater les données pour le dashboard
    const dashboardData = {
      totalEvents: organizer.events?.length || 0,
      totalParticipants:
        organizer.events?.reduce(
          (acc, event) => acc + (event.participants?.length || 0),
          0
        ) || 0,
      engagementRate: calculateEngagementRate(organizer.events),
      recentMessages: organizer.messages?.slice(0, 5) || [],
      pendingTasks:
        organizer.tasks?.filter((task) => task.status === "pending") || [],
    }

    console.log("dashboardData formatées:", dashboardData)

    res.status(200).json(dashboardData)
  } catch (error) {
    console.error("Erreur dans getDashboardData:", error)
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des données" })
  }
}

// Récupération des paramètres de l'organisateur
exports.getOrganizerSettings = async (req, res) => {
  try {
    const { userId } = req.params
    const organizer = await Organizer.findOne({ user: userId }).populate("user")

    if (!organizer) {
      return res.status(404).json({ error: "Organisateur non trouvé" })
    }

    // Ajout de lastName et phone dans les données retournées
    const settings = {
      name: organizer.user.name,
      lastName: organizer.lastName, // Ajout du champ lastName
      email: organizer.user.email,
      company: organizer.company,
      phone: organizer.phone, // Ajout du champ phone
      language: organizer.language,
    }

    res.status(200).json(settings)
  } catch (error) {
    console.error("Erreur dans getOrganizerSettings:", error)
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des paramètres" })
  }
}

// Mise à jour des paramètres de l'organisateur
exports.updateOrganizerSettings = async (req, res) => {
  try {
    const { userId } = req.params
    const updates = req.body

    const organizer = await Organizer.findOne({ user: userId })
    if (!organizer) {
      return res.status(404).json({ error: "Organisateur non trouvé" })
    }

    // Mise à jour de tous les champs de l'organisateur
    organizer.company = updates.company
    organizer.language = updates.language
    organizer.lastName = updates.lastName // Ajout de la mise à jour du lastName
    organizer.phone = updates.phone // Ajout de la mise à jour du phone
    await organizer.save()

    // Mise à jour des champs de l'utilisateur
    const user = await User.findById(userId)
    if (user) {
      user.name = updates.name
      user.email = updates.email
      await user.save()
    }

    res.status(200).json({
      message: "Paramètres mis à jour avec succès",
      data: {
        ...updates,
        _id: organizer._id,
      },
    })
  } catch (error) {
    console.error("Erreur dans updateOrganizerSettings:", error)
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour des paramètres" })
  }
}

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.params.userId

    // Récupérer tous les événements de l'organisateur (sans filtre temporel)
    const events = await Event.find({
      createdBy: userId,
    }).populate("participants")

    // Récupérer tous les packs et paiements associés
    const packs = await Pack.find({
      event: {
        $in: events.map((event) => event._id),
      },
    })

    const payments = await PaymentPack.find({
      pack: { $in: packs.map((pack) => pack._id) },
    })

    // Calculer les statistiques globales
    const stats = {
      // Statistiques des événements
      totalEvents: events.length,
      activeEvents: events.filter((event) => event.status === "Publié").length,

      // Statistiques des participants
      totalParticipants: events.reduce(
        (sum, event) => sum + (event.participants?.length || 0),
        0
      ),
      averageParticipants: Math.round(
        events.reduce(
          (sum, event) => sum + (event.participants?.length || 0),
          0
        ) / (events.length || 1)
      ),

      // Statistiques des revenus
      totalRevenue: payments.reduce((sum, payment) => sum + payment.amount, 0),
      averageRevenue: Math.round(
        payments.reduce((sum, payment) => sum + payment.amount, 0) /
          (events.length || 1)
      ),

      // Statistiques de conversion
      totalConversions: payments.length,
      conversionRate: calculateConversionRate(
        payments.length,
        packs.reduce((sum, pack) => sum + pack.maxSponsors, 0)
      ),

      // Distribution par catégorie
      categoryDistribution: getCategoryDistribution(events),

      // Top événements
      topEvents: getTopEvents(events, payments, 5),
    }

    res.status(200).json(stats)
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error)
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
    })
  }
}

// Fonctions utilitaires
const calculateConversionRate = (conversions, total) => {
  if (!total) return 0
  return Math.round((conversions / total) * 100)
}

const getCategoryDistribution = (events) => {
  const distribution = events.reduce((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1
    return acc
  }, {})

  return Object.entries(distribution)
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / events.length) * 100),
    }))
    .sort((a, b) => b.count - a.count)
}
const getTopEvents = (events, payments, limit = 5) => {
  return events
    .map((event) => {
      const eventPayments = payments.filter((payment) =>
        event.packs?.includes(payment.pack)
      )
      return {
        id: event._id,
        name: event.name,
        date: event.date,
        participants: event.participants?.length || 0,
        revenue: eventPayments.reduce(
          (sum, payment) => sum + payment.amount,
          0
        ),
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}
exports.getSponsorshipStats = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Récupérer tous les événements de l'organisateur
    const events = await Event.find({ createdBy: userId });
    
    // Récupérer tous les packs avec leurs événements associés
    const packs = await Pack.find({
      event: { $in: events.map(event => event._id) }
    }).populate('event', 'name date');

    // Récupérer tous les paiements avec leurs packs associés
    const payments = await PaymentPack.find({
      pack: { $in: packs.map(pack => pack._id) }
    }).populate({
      path: 'pack',
      select: 'name maxSponsors currentSponsors price event',
      populate: {
        path: 'event',
        select: 'name date'
      }
    }).sort({ createdAt: 1 });

    // Générer les statistiques globales et les tendances
    const { globalStats, trendData } = generateStats(payments, packs);

    res.status(200).json({
      ...globalStats,
      trendData,
      success: true
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

const generateStats = (payments, packs) => {
  // Statistiques globales
  const globalStats = {
    totalPacks: packs.length,
    availableSpots: packs.reduce((sum, pack) => 
      sum + (pack.maxSponsors - pack.currentSponsors), 0),
    totalSponsors: payments.length,
    totalRevenue: payments.reduce((sum, payment) => sum + payment.amount, 0),
    averageRevenue: payments.length ? 
      Math.round(payments.reduce((sum, payment) => 
        sum + payment.amount, 0) / payments.length) : 0,
    conversionRate: calculateConversionRate(
      payments.length,
      packs.reduce((sum, pack) => sum + pack.maxSponsors, 0)
    ),
    topPacks: generateTopPacks(packs, payments)
  };

  // Données de tendance
  const trendData = generateMonthlyTrendData(payments);

  return { globalStats, trendData };
};

const generateMonthlyTrendData = (payments) => {
  const monthlyData = {};
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // Initialiser les données pour les 12 derniers mois
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toLocaleDateString('fr-FR', { 
      month: 'short', 
      year: 'numeric' 
    });
    
    monthlyData[monthKey] = {
      month: monthKey,
      revenue: 0,
      sponsors: 0,
      averagePackValue: 0,
      packsSold: 0,
      conversionRate: 0
    };
  }

  // Calculer les statistiques mensuelles
  payments.forEach(payment => {
    const paymentDate = new Date(payment.createdAt);
    if (paymentDate >= twelveMonthsAgo) {
      const monthKey = paymentDate.toLocaleDateString('fr-FR', { 
        month: 'short', 
        year: 'numeric' 
      });
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].revenue += payment.amount;
        monthlyData[monthKey].sponsors += 1;
        monthlyData[monthKey].packsSold += 1;
        monthlyData[monthKey].averagePackValue = 
          monthlyData[monthKey].revenue / monthlyData[monthKey].sponsors;
      }
    }
  });

  return Object.values(monthlyData).reverse();
};

const generateTopPacks = (packs, payments) => {
  return packs
    .map(pack => ({
      id: pack._id,
      name: pack.name,
      eventName: pack.event.name,
      maxSponsors: pack.maxSponsors,
      currentSponsors: pack.currentSponsors,
      revenue: payments
        .filter(payment => payment.pack._id.toString() === pack._id.toString())
        .reduce((sum, payment) => sum + payment.amount, 0),
      conversionRate: calculateConversionRate(
        pack.currentSponsors,
        pack.maxSponsors
      )
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
};

