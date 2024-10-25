const express = require('express');
const userRouter = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser } = require('../Controllers/users.controller');

const passport = require("passport");
const { ROLES } = require("../constants/index");
const  authorize  = require("../Middlewares/auth.middleware");

// const authMiddleware = require('../middleware/authMiddleware');
// const adminMiddleware = require('../middleware/adminMiddleware'); // Si vous voulez restreindre certaines routes aux administrateurs

// Route pour obtenir tous les utilisateurs
userRouter.get('/', getAllUsers);

// Route pour obtenir un utilisateur par ID
userRouter.get('/:id', getUserById);

// Route pour mettre à jour un utilisateur par ID
userRouter.put('/:id',[passport.authenticate("jwt", { session: false }), authorize([ROLES.USER])], updateUser); // Vous pouvez ajouter adminMiddleware si nécessaire

// Route pour supprimer un utilisateur par ID
userRouter.delete('/:id', deleteUser); // Vous pouvez ajouter adminMiddleware si nécessaire

module.exports = userRouter;
