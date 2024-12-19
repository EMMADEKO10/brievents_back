const RewardLevel = require('../Models/rewardLevel.model');

const initializeRewardLevels = async () => {
    try {
        const count = await RewardLevel.countDocuments();
        if (count === 0) {
            const defaultLevels = [
                {
                    name: 'Bronze',
                    minPoints: 0,
                    maxPoints: 100,
                    benefits: 'Accès aux fonctionnalités de base'
                },
                {
                    name: 'Silver',
                    minPoints: 101,
                    maxPoints: 500,
                    benefits: 'Accès aux fonctionnalités avancées'
                },
                {
                    name: 'Gold',
                    minPoints: 501,
                    benefits: 'Accès à toutes les fonctionnalités',
                    requiresInvitation: true
                }
            ];

            await RewardLevel.insertMany(defaultLevels);
            console.log('Niveaux de récompense initialisés avec succès');
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des niveaux:', error);
    }
};

module.exports = { initializeRewardLevels }; 