const { SponsorLevel } = require('../Models/sponsor.model');

const initializeSponsorLevels = async () => {
  const levels = [
    {
      name: 'EMERGENT',
      minPoints: 0,
      maxPoints: 1000,
      benefits: [
        'Mention spéciale sur la plateforme',
        'Accès aux premières opportunités de partenariat'
      ]
    },
    {
      name: 'SILVER',
      minPoints: 1001,
      maxPoints: 5000,
      benefits: [
        'Accès anticipé aux projets',
        'Visibilité accrue',
        'Invitations aux événements exclusifs'
      ]
    },
    {
      name: 'GOLD',
      minPoints: 5001,
      maxPoints: 10000,
      benefits: [
        'Réductions sur les services',
        'Réseautage privilégié',
        'Mise en avant du logo'
      ]
    },
    {
      name: 'PLATINUM',
      minPoints: 10001,
      maxPoints: 30000,
      benefits: [
        'Partenariat exclusif',
        'Visibilité maximale',
        'Co-branding avec l\'événement'
      ]
    },
    {
      name: 'LEGENDARY',
      minPoints: 30001,
      isInviteOnly: true,
      benefits: [
        'Accès aux opportunités stratégiques',
        'Influence dans les décisions majeures',
        'Services premium'
      ]
    }
  ];

  try {
    await SponsorLevel.deleteMany({});
    await SponsorLevel.insertMany(levels);
    console.log('Niveaux de sponsor initialisés avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des niveaux:', error);
  }
};

module.exports = { initializeSponsorLevels }; 