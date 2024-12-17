const express = require('express');
const adminUserRouter = express.Router();
// const { authenticateToken, isAdmin } = require('../../middleware/authMiddleware');
const {
    updateUser,
    deleteUserById,
    getUserByIdAdmin,
    getPendingUsers,
    changeUserRole
} = require('../../Controllers/Admin/user.adminControl');

// Route pour obtenir un utilisateur spécifique (admin)
adminUserRouter.get('/:id', getUserByIdAdmin);

// Route pour mettre à jour un utilisateur
adminUserRouter.put('/:id', updateUser);

// Route pour supprimer un utilisateur
adminUserRouter.delete('/:id', deleteUserById);

// Route pour obtenir la liste des utilisateurs en attente
adminUserRouter.get('/pending/list', getPendingUsers);

// Route pour changer le rôle d'un utilisateur
adminUserRouter.put('/role/:id', changeUserRole);

module.exports = adminUserRouter;
