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

// Middleware d'authentification
adminRewardRouter.use(authenticateToken, isAdmin);

// Routes pour les niveaux de récompense
adminRewardRouter.get('/levels', getAllRewardLevels);
adminRewardRouter.post('/levels', createRewardLevel);
adminRewardRouter.put('/levels/:id', updateRewardLevel);
adminRewardRouter.delete('/levels/:id', deleteRewardLevel);

// Routes pour les paiements
adminRewardRouter.get('/payments', getPaymentPacksList);
adminRewardRouter.get('/payments/stats', getPaymentPacksStats);
adminRewardRouter.patch('/payments/:id/status', updatePaymentPackStatus);

module.exports = adminRewardRouter; 