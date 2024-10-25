const { Sponsor, PendingSponsor } = require('../Models/sponsor.model');
const User = require('../Models/users.model')
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { sendEmail } = require('../configs/sendEmails');

// Add a new sponsor
exports.addSponsor = async (req, res) => {
  const { name, email, phone, language } = req.body;

  try { 
    // Check if a pending sponsor with the same email already exists
    const existingPendingSponsor = await PendingSponsor.findOne({ email });
    if (existingPendingSponsor) {
      return res.status(400).json({ message: "Une demande de conseiller avec cet email est déjà en attente" });
    }
    
    // Generate a unique token
    const validationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expires in 24 hours

    // Create the pending sponsor
    const newPendingSponsor = new PendingSponsor({
      name,
      email,
      phone,
      language,
      validationToken,
      tokenExpiration,
    });

    await newPendingSponsor.save();

    // Validation URL (adjust according to your frontend configuration)
    const validationUrl = `${process.env.FRONTEND_URL}/validationSponsor/${validationToken}`;

    // Send an email with the validation link
    const emailSubject = "Validez votre demande de conseiller";
    const emailText = `Cliquez sur ce lien pour valider votre demande de conseiller : ${validationUrl}`;
    const emailHtml = `
      <h1>Validation de votre demande de conseiller</h1>
      <p>Cher(e) ${name},</p>
      <p>Veuillez cliquer sur le lien ci-dessous pour valider votre demande de conseiller :</p>
      <a href="${validationUrl}">Valider ma demande</a>
      <p>Ce lien expirera dans 24 heures.</p>
    `;

    await sendEmail(email, emailSubject, emailText, emailHtml);

    res.status(201).json({
      message: "Demande de conseiller enregistrée avec succès et en attente de validation.",
      pendingSponsor: newPendingSponsor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Confirm sponsor
exports.confirmSponsor = async (req, res) => {
      const { token } = req.params;
try {
      const pendingSponsor = await PendingSponsor.findOne({
      validationToken: token,
      tokenExpiration: { $gt: Date.now() },
    });
    
if (!pendingSponsor) {
      // console.log('No pending sponsor found or token expired',token, pendingSponsor.token );
      return res.status(400).json({ message: "Token invalide ou expiré" });
    }
    const email = pendingSponsor.email;
    const existingUser = await User.findOne({email})
    if (!existingUser) {
      return res.status(400).json({ message: "il ne existe pas un utiisateur avec ce nom" });
    }

    // Create a new Sponsor from the PendingSponsor
    const newSponsor = new Sponsor({
      user : existingUser._id,
      name: pendingSponsor.name,
      email: pendingSponsor.email,
      phone: pendingSponsor.phone,
      language: pendingSponsor.language,
    });
    await newSponsor.save();

     // Update the role of the user to "Sponsor"
     existingUser.role = 'Sponsor';
     await existingUser.save();
     
    // Delete the PendingSponsor
    await PendingSponsor.findByIdAndDelete(pendingSponsor._id);
    // Send a confirmation email
    const emailSubject = "Votre compte conseiller est validé";
    const emailText = "Félicitations ! Votre compte conseiller a été validé avec succès.";
    const emailHtml = `
      <h1>Compte conseiller validé</h1>
      <p>Cher(e) ${newSponsor.name},</p>
      <p>Félicitations ! Votre compte conseiller a été validé avec succès.</p>
      <p>Vous pouvez maintenant accéder à toutes les fonctionnalités de conseiller sur notre plateforme.</p>
    `;
    await sendEmail(newSponsor.email, emailSubject, emailText, emailHtml);
    res.json({ message: "Compte conseiller validé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete an Sponsor
exports.deleteSponsor = async (req, res) => {
    try {
        const Sponsor = await Sponsor.findByIdAndDelete(req.params.id);
        if (!Sponsor) return res.status(404).json({ error: "Sponsor not found" });
        res.status(200).json({ message: "Sponsor deleted successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get a single Sponsor by ID
exports.getSponsor = async (req, res) => {
    try {
        const Sponsor = await Sponsor.findById(req.params.id);
        if (!Sponsor) return res.status(404).json({ error: "Sponsor not found" });
        res.status(200).json(Sponsor);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllSponsors = async (req, res) => {
  try {
    const { userId } = req.query; // Récupérer l'ID de l'utilisateur connecté depuis la requête
    const sponsors = await Sponsor.find().lean();

    const sponsorsWithUserInfo = await Promise.all(sponsors.map(async (sponsor) => {
      const user = await User.findById(sponsor.user).lean();
      
      // Récupérer le nombre de messages non lus pour cet conseiller
      const unreadCount = userId ? await Chat.countDocuments({
        user: userId,
        Sponsor: Sponsor.user,
        sender: 'Sponsor',
        isRead: false
      }) : 0;

      return {
        ...Sponsor,
        avatar: user ? user.image : null,
        unreadCount: unreadCount
      };
    }));

    res.status(200).json(sponsorsWithUserInfo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
