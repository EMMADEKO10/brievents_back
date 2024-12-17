const { Sponsor } = require('../Models/sponsor.model');
const RewardLevel = require('../Models/rewardLevel.model');
const { User } = require('../Models/user.model');
const { sendEmail } = require('../configs/sendEmails');

// Calcul des points pour un sponsor
const calculatePoints = async (sponsorId) => {
  const sponsor = await Sponsor.findOne({ user: sponsorId }).populate('user');
  if (!sponsor) return null;

  // Calcul des points basé sur l'investissement et les projets
  const investmentPoints = sponsor.totalInvested || 0;
  const projectPoints = (sponsor.projectsSponsored || 0) * 100;
  const totalPoints = investmentPoints + projectPoints;

  return totalPoints;
};

// Mise à jour du niveau du sponsor
const updateSponsorLevel = async (sponsor) => {
  const levels = await RewardLevel.find().sort({ minPoints: 1 });
  
  let newLevel = null;
  for (const level of levels) {
    if (level.name === 'LEGENDARY') {
      if (sponsor.totalPoints >= 30000 && sponsor.hasLegendaryInvitation) {
        newLevel = level;
        break;
      }
      continue;
    }

    if (sponsor.totalPoints >= level.minPoints && 
       (!level.maxPoints || sponsor.totalPoints <= level.maxPoints)) {
      newLevel = level;
      break;
    }
  }

  if (newLevel && (!sponsor.currentLevel || 
      sponsor.currentLevel.toString() !== newLevel._id.toString())) {
    const user = await User.findById(sponsor.user);
    
    // Notification du changement de niveau
    if (user && user.email) {
      await sendEmail(
        user.email,
        'Nouveau niveau atteint !',
        `Félicitations ! Vous avez atteint le niveau ${newLevel.name}`,
        `<h1>Félicitations !</h1>
         <p>Vous avez atteint le niveau ${newLevel.name}</p>
         <p>Nouveaux avantages débloqués :</p>
         <ul>${newLevel.benefits.map(benefit => `<li>${benefit}</li>`).join('')}</ul>`
      );
    }

    sponsor.currentLevel = newLevel._id;
    await sponsor.save();
  }

  return newLevel;
};

// Mise à jour des points après une action
exports.updateSponsorPoints = async (req, res) => {
  const { sponsorId } = req.params;

  try {
    const sponsor = await Sponsor.findOne({ user: sponsorId })
      .populate('currentLevel')
      .populate('user');

    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor non trouvé'
      });
    }

    // Calcul des nouveaux points
    const totalPoints = await calculatePoints(sponsorId);
    sponsor.totalPoints = totalPoints;
    await sponsor.save();

    // Mise à jour du niveau
    const newLevel = await updateSponsorLevel(sponsor);

    // Calcul de la progression vers le niveau suivant
    const levels = await RewardLevel.find().sort({ minPoints: 1 });
    const currentLevelIndex = levels.findIndex(l => 
      l._id.toString() === (sponsor.currentLevel?._id?.toString() || '')
    );
    
    let progression = {
      currentLevel: newLevel?.name || 'EMERGENT',
      currentPoints: totalPoints,
      nextLevel: null,
      pointsToNextLevel: null,
      progressPercentage: 100
    };

    if (currentLevelIndex < levels.length - 1) {
      const nextLevel = levels[currentLevelIndex + 1];
      progression.nextLevel = nextLevel.name;
      progression.pointsToNextLevel = nextLevel.minPoints - totalPoints;
      progression.progressPercentage = Math.min(
        100,
        (totalPoints / nextLevel.minPoints) * 100
      );
    }

    res.status(200).json({
      success: true,
      data: {
        totalPoints,
        currentLevel: newLevel,
        progression
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour des points:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des points',
      error: error.message
    });
  }
};

// Obtenir les détails du niveau actuel et la progression
exports.getRewardDetails = async (req, res) => {
  const { sponsorId } = req.params;

  try {
    const sponsor = await Sponsor.findOne({ user: sponsorId })
      .populate('currentLevel')
      .populate('user');

    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor non trouvé'
      });
    }

    const totalPoints = await calculatePoints(sponsorId);
    const levels = await RewardLevel.find().sort({ minPoints: 1 });
    const currentLevelIndex = levels.findIndex(l => 
      l._id.toString() === (sponsor.currentLevel?._id?.toString() || '')
    );

    let progression = {
      currentLevel: sponsor.currentLevel?.name || 'EMERGENT',
      currentPoints: totalPoints,
      nextLevel: null,
      pointsToNextLevel: null,
      progressPercentage: 100,
      benefits: sponsor.currentLevel?.benefits || []
    };

    if (currentLevelIndex < levels.length - 1) {
      const nextLevel = levels[currentLevelIndex + 1];
      progression.nextLevel = nextLevel.name;
      progression.pointsToNextLevel = nextLevel.minPoints - totalPoints;
      progression.progressPercentage = Math.min(
        100,
        (totalPoints / nextLevel.minPoints) * 100
      );
    }

    res.status(200).json({
      success: true,
      data: progression
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des détails de récompense:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails de récompense',
      error: error.message
    });
  }
};