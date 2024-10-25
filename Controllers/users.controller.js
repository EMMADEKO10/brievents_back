// Controllers/users.controller.js
const User = require('../Models/users.model');
const { Advisor } = require('../Models/advisor.model');

// const jwt = require('jsonwebtoken');
// const { AppError } = require('../utils/AppError');
const bcrypt = require('bcryptjs');
// const  catchAsync = require('../utils/catchAsync');

// Obtenir tous les utilisateurs
const getAllUsers = async (req, res) => {
  try {
      const users = await User.find().select('-password');
      res.json(users);
  } catch (err) {
      console.error(err.message);
      res.status(500).send("Erreur serveur");
  }
};

// // Obtenir un utilisateur par ID
// const getUserById = async (req, res) => {
//   const id = req.params.id
//   try {
//       const user = await User.findById(id).select('-password');
//       if (!user) {
//           return res.status(404).json({ error: "Utilisateur non trouvé reso" });
//       }
//       res.json(user);
//   } catch (err) {
//       console.error(err.message);
//       res.status(500).send("Erreur serveur");
//   }
// };


const getUserById = async (req, res) => {
  const id = req.params.id;
  try {
    // Recherche d'abord dans le modèle User
    let user = await User.findById(id).select('-password');
    
    // Si l'utilisateur n'est pas trouvé, recherche dans le modèle Advisor
    if (!user) {
      const advisor = await Advisor.findById(id);
      if (advisor) {
        // Si un conseiller est trouvé, récupère l'utilisateur correspondant
        user = await User.findById(advisor.user).select('-password');
      }
    }

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Erreur serveur");
  }
};

// Mettre à jour un utilisateur par ID
const updateUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  const id = req.params.id

  try {
      let user = await User.findById(id);
      if (!user) {
          return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      // Mettre à jour les champs
      user.name = name || user.name;
      user.email = email || user.email;
      user.role = role || user.role;
      if (password) {
              const salt = await bcrypt.genSalt(10);
              user.password = await bcrypt.hash(password, salt);
      }
      await user.save();
      res.json(user);
  } catch (err) {
      console.error(err.message);
      res.status(500).send("Erreur serveur");
  }
};

// Supprimer un utilisateur par ID
const deleteUser = async (req, res) => {
  try {
      const user = await User.findById(req.params.id);
      if (!user) {
          return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      await User.deleteOne({ _id: req.params.id });
      res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (err) {
      console.error(err.message);
      res.status(500).send("Erreur serveur");
  }
};


module.exports = {getAllUsers,getUserById,updateUser, deleteUser }

// Ajoutez d'autres fonctions de contrôleur selon vos besoins