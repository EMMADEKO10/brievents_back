// utils/sendEmails.js

const nodemailer = require('nodemailer');

// Créer un transporteur réutilisable en utilisant SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'emmanueldeko64@gmail.com',
      pass: 'wjfk dqvw pbwg lcin'
    },
    tls: {
      rejectUnauthorized: false
    }
});

// Fonction pour envoyer un e-mail
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      // from: '"Sotradons SA" <emmanueldeko64@gmail.com>', // Adresse de l'expéditeur
      from: '"diasporium SA"', // Adresse de l'expéditeur
      to: to, // Liste des destinataires
      subject: subject, // Sujet de l'e-mail
      text: text, // Version texte brut du corps du message
      html: html // Version HTML du corps du message
    });

    console.log('Message envoyé: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
    throw error;
  }
};

module.exports = { sendEmail };