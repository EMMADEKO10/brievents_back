const mongoose = require('mongoose');
require('dotenv').config();
const RewardLevel = require('../Models/rewardLevel.model');

const initialLevels = [
  {
    name: 'EMERGENT',
    minPoints: 0,
    maxPoints: 1000,
    benefits: [
      'Accès aux événements de base',
      'Badge Emergent',
      'Newsletter mensuelle',
      'Visibilité de base sur la plateforme'
    ]
  },
  {
    name: 'SILVER',
    minPoints: 1001,
    maxPoints: 5000,
    benefits: [
      'Tous les avantages Emergent',
      'Badge Silver',
      'Accès aux événements premium',
      'Support prioritaire par email',
      'Mention spéciale sur les événements sponsorisés'
    ]
  },
  {
    name: 'GOLD',
    minPoints: 5001,
    maxPoints: 10000,
    benefits: [
      'Tous les avantages Silver',
      'Badge Gold',
      'Accès VIP aux événements',
      'Support téléphonique dédié',
      'Placement premium sur la plateforme',
      'Invitations aux événements exclusifs'
    ]
  },
  {
    name: 'PLATINUM',
    minPoints: 10001,
    maxPoints: 30000,
    benefits: [
      'Tous les avantages Gold',
      'Badge Platinum',
      'Accès exclusif aux avant-premières',
      'Support 24/7 personnalisé',
      'Placement prioritaire sur tous les supports',
      'Accès au réseau VIP',
      'Consultation stratégique trimestrielle'
    ]
  },
  {
    name: 'LEGENDARY',
    minPoints: 30001,
    requiresInvitation: true,
    benefits: [
      'Tous les avantages Platinum',
      'Badge Legendary exclusif',
      'Statut de partenaire stratégique',
      'Accès illimité à tous les événements',
      'Service de conciergerie dédié',
      'Participation au conseil consultatif',
      'Événements sur mesure',
      'Opportunités de co-branding'
    ]
  }
];

const seedRewardLevels = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB pour le seeding');

    // Suppression des niveaux existants
    await RewardLevel.deleteMany({});
    console.log('Niveaux de récompense existants supprimés');

    // Création des nouveaux niveaux
    const createdLevels = await RewardLevel.insertMany(initialLevels);
    console.log('Nouveaux niveaux de récompense créés:', createdLevels);

    // Déconnexion de MongoDB
    await mongoose.connection.close();
    console.log('Déconnecté de MongoDB');

  } catch (error) {
    console.error('Erreur lors du seeding:', error);
    process.exit(1);
  }
};

// Exécution du script
seedRewardLevels(); 