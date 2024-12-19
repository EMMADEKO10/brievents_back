const express = require('express');
const adminRewardRouter = express.Router();
const { authenticateToken, isAdmin } = require('../../middleware/authMiddleware');
const {
    getAllRewardLevels,
    createRewardLevel,
    updateRewardLevel,
    deleteRewardLevel,
    getPaymentPacksStats,
    getPaymentPacksList,
    updatePaymentPackStatus
} = require('../../Controllers/Admin/reward.adminControl');

// Appliquer l'authentification et la vérification admin
adminRewardRouter.use(authenticateToken, isAdmin);

// Routes pour les niveaux de récompense
adminRewardRouter.get('/levels', getAllRewardLevels);
adminRewardRouter.post('/levels', createRewardLevel);
adminRewardRouter.put('/levels/:id', updateRewardLevel);
adminRewardRouter.delete('/levels/:id', deleteRewardLevel);

// Routes pour les statistiques et la gestion des paiements
adminRewardRouter.get('/payments/stats', getPaymentPacksStats);
adminRewardRouter.get('/payments', getPaymentPacksList);
adminRewardRouter.patch('/payments/:id/status', updatePaymentPackStatus);

// Route pour obtenir les statistiques détaillées
adminRewardRouter.get('/payments/stats/detailed', getPaymentPacksStats);

module.exports = adminRewardRouter; 