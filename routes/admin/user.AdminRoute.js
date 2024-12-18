const express = require('express');
const adminUserRouter = express.Router();
const { authenticateToken, isAdmin } = require('../../middleware/authMiddleware');
const {
    updateUser,
    deleteUserById,
    getUserByIdAdmin,
    getPendingUsers,
    changeUserRole,
    loginAdmin
} = require('../../Controllers/Admin/user.adminControl');

// Route de connexion admin (pas besoin d'authentification pour cette route)
adminUserRouter.post('/login', loginAdmin);

// Routes protégées
adminUserRouter.use(authenticateToken, isAdmin);

adminUserRouter.get('/:id', getUserByIdAdmin);
adminUserRouter.put('/:id', updateUser);
adminUserRouter.delete('/:id', deleteUserById);
adminUserRouter.get('/pending/list', getPendingUsers);
adminUserRouter.put('/role/:id', changeUserRole);

module.exports = adminUserRouter;
