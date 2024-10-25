// Controllers/users.controller.js
const User = require('../Models/users.model');
const PendingUser = require('../Models/pendingUser.model')
const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/AppError');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { sendEmail } = require("../configs/sendEmails");

// const  catchAsync = require('../utils/catchAsync');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};
// -----------------------------------------------------------------------
// Contrôleur pour l'inscription en attente
// Contrôleur pour l'inscription en attente
const pendingSignup = async (req, res) => {
    const { name, email, password, passwordConfirm } = req.body;
    
    if (password !== passwordConfirm) {
      return res.status(400).json({ error: "Les mots de passe ne correspondent pas." });
    }
    
    try {
      let user = await PendingUser.findOne({ email });
      if (user) {
        return res.status(400).json({ error: "Un utilisateur avec cet email existe déjà." });
      }
      
      const confirmationToken = crypto.randomBytes(20).toString('hex');

      console.log("belcheckatwood.09@gmail.com : ",confirmationToken )
      
      user = new PendingUser({
        name,
        email,
        password,
        confirmationToken
      });
      
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      
      await user.save();
      
      // Utiliser la fonction sendEmail pour envoyer l'email de confirmation
      const subject = 'Confirmation de votre inscription';
      const text = `Cliquez sur ce lien pour confirmer votre inscription : ${process.env.FRONTEND_URL}/confirm/${confirmationToken}`;
      const confirmationLink = `${process.env.FRONTEND_URL}/Auth/confirm/${confirmationToken}`;
     const html = `<!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation d'inscription</title>
        <style>
            body {
                font-family: 'Nunito', sans-serif;
                line-height: 1.6;
                color: #14141F;
                background-color: #F5F5F5;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #FFFFFF;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 45px rgba(0, 0, 0, .08);
            }
            .header {
                background-color: #86B817;
                color: #FFFFFF;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }
            .content {
                padding: 20px;
            }
            .button {
                display: inline-block;
                background-color: #86B817;
                color: #FFFFFF;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 4px;
                font-weight: 600;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                color: #14141F;
                font-size: 0.9em;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Confirmation de votre inscription</h1>
            </div>
            <div class="content">
                <p>Bonjour,</p>
                <p>Merci de vous être inscrit(e) sur notre plateforme. Pour finaliser votre inscription, veuillez cliquer sur le bouton ci-dessous :</p>
                <p style="text-align: center;">
                    <a href="${confirmationLink}" class="button">Confirmer mon inscription</a>
                </p>
                <p>Si vous n'avez pas demandé cette inscription, vous pouvez ignorer cet e-mail.</p>
                <p>Cordialement,<br>L'équipe Diasporium</p>
            </div>
            <div class="footer">
                <p>Cet e-mail a été envoyé par Diasporium SA. Tous droits réservés.</p>
            </div>
        </div>
    </body>
    </html>`;
      
      await sendEmail(email, subject, text, html);
      
      res.status(201).json({ message: "Inscription en attente. Veuillez vérifier votre email pour confirmer." });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Erreur lors de l'inscription de l'utilisateur.");
    }
  };

// Contrôleur pour finaliser l'inscription
const signup = async (req, res) => {
    const token = req.params.token;
    console.log("Token reçu:", token);

    try {
        // Vérifier si le token est vide ou non défini
        if (!token) {
            console.log("Token manquant dans la requête");
            return res.status(400).json({ success: false, error: "Token manquant" });
        }

        // Rechercher le PendingUser et vérifier si le token a déjà été utilisé
        const pendingUser = await PendingUser.findOneAndUpdate(
            { confirmationToken: token, isTokenUsed: false },
            { isTokenUsed: true },
            { new: true }
        );
        console.log("PendingUser trouvé:", pendingUser);

        if (!pendingUser) {
            console.log("Aucun PendingUser valide trouvé pour le token:", token);
            return res.status(400).json({ success: false, error: "Token invalide, expiré ou déjà utilisé." });
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email: pendingUser.email });
        if (existingUser) {
            console.log("Utilisateur existant trouvé avec l'email:", pendingUser.email);
            return res.status(400).json({ success: false, error: "Un utilisateur avec cet email existe déjà." });
        }

        // Créer le nouvel utilisateur
        let user = new User({
            name: pendingUser.name,
            email: pendingUser.email,
            password: pendingUser.password,
        });
        
        await user.save();
        console.log("Nouvel utilisateur créé:", user);

        // Supprimer le PendingUser
        await PendingUser.findByIdAndDelete(pendingUser._id);
        console.log("PendingUser supprimé");
        
        res.status(201).json({ 
            success: true,
            message: "Inscription finalisée avec succès.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error("Erreur dans la fonction signup:", err);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la finalisation de l'inscription.",
            message: err.message
        });
    }
};

// ----------------------------------------------------------------------------------------------------------------------

// Controller de connexion (login)
const login = async (req, res) => {
  const { email, password } = req.body;
 try {
      // Recherchez l'utilisateur dans la base de données par son email
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ message: "Utilisateur non trouvé." });
      }
      // Vérifiez si le mot de passe est correct
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
          return res.status(401).json({ message: "Mot de passe incorrect." });
      }
      // Créez un token JWT
      const payload = {
          id: user._id,
          email:user.email,
          role: user.role
      };
      // Générez le token JWT avec une durée de validité de 10 heures (en secondes)
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
      // Envoyez le user et son token dans la réponse
      res.status(200).json({ message: "Connexion réussie.", user, token });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};
// ---------------------------------------------------------------------------------------------------------------------------

const getMe = async (req, res) => {
  try {
      const user = await User.findById(req.user.userId)
      res.send({
          succes: true,
          message: "use fetched succefull ou l'utilisateur est fetcher sans problème ",
          data: user,
      }
      )
  } catch (error) {
      res.send({
          succes: false,
          message: error.message
      })
  }
}

module.exports = {getMe,login,signup,pendingSignup }

// Ajoutez d'autres fonctions de contrôleur selon vos besoins