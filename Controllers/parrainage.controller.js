const dotenv = require("dotenv");
// const Payment = require("../Models/payment.model");
const {User} = require("../Models/user.model");
// const mongoose = require('mongoose');
// const {createCreditNotification} = require("../notofications/notification.controller")
const { Parrainage, PendingParrainage } = require("../Models/parrainage.model");

dotenv.config();

const addPendingParrainage = async (req, res) => {
    const { amount, email, telephone, user, reference, event } = req.body;
    console.log("amount, email, telephone, user ", amount, email, telephone, user);
    
    try {
      if (!user) {
        throw new Error("User ID is required");
      }
    
    if (!event) {
        throw new Error("Event ID is required");
      }
      const newParrainage = new PendingParrainage({
        amount,
        email,
        reference,
        user,
        telephone,
        event
      });
      
      await newParrainage.save();
      
      res.json({ message: "Parrainage pending", reference });
    } catch (error) {
      console.error("Error initiating parrainage:", error);
      res.status(400).json({ error: error.message || "An error occurred while initiating the parrainage" });
    }
};
// ---------------------------------------------------------------------
const addParrainage = async (req, res) => {
    try {
      const { reference } = req.body;
      console.log(`Recherche du parrainage avec la référence: ${reference}`);
      // Vérifier si le parrainage existe déjà
      let parrainage = await Parrainage.findOne({ reference });
      if (parrainage) {
        console.log(`Parrainage déjà existant dans Parrainage:`, parrainage);
        return res.json({
          reference: parrainage.reference,
          amount: parrainage.amount,
          email: parrainage.email,
          status: parrainage.status,
          transactionId: parrainage.maxiCashTransactionId
        });
      }
      
      const pendingParrainage = await PendingParrainage.findOne({ reference });
      if (!pendingParrainage) {
        console.log(`Aucun parrainage en attente trouvé pour la référence: ${reference}`);
        return res.status(404).json({ error: 'Parrainage non trouvé' });
      }

      // Utiliser findOneAndUpdate avec upsert pour éviter les doublons
      const newParrainage = await Parrainage.findOneAndUpdate(
        { reference: pendingParrainage.reference },
        {
          user: pendingParrainage.user,
          amount: pendingParrainage.amount,
          email: pendingParrainage.email,
          event: pendingParrainage.event,
          maxiCashTransactionId: pendingParrainage.maxiCashTransactionId,
          status: 'completed', // Ajoutez un statut si nécessaire
        },
        { upsert: true, new: true }
      );

      console.log(`Nouveau parrainage crédit ou mis à jour:`, newParrainage.user, pendingParrainage.user);
       const user = await User.findById(newParrainage.user)  
      console.log(`is à jour:`, user.name);
        const values =  newParrainage.amount;
      console.log(`Nouv mis à jour:`, values);
        // Créer une notification de crédit à l'utilisateur créé ou mis à jour
        // Utiliser le nom de l'utilisateur pour la création de la notification
      const message = `Demande de crédit pour un montant de ${values}`
        // await createCreditNotification(message, user.name );    
        // Supprimer le paiement en attente seulement après avoir réussi à créer/mettre à jour le paiement
      await PendingParrainage.deleteOne({ reference: pendingParrainage.reference });
      console.log(`PendingParrainage supprimé`);
      
      res.json({
        reference: newParrainage.reference,
        amount: newParrainage.amount,
        email: newParrainage.email,
        status: newParrainage.status,
        transactionId: newParrainage.maxiCashTransactionId,
        // projet: newParrainage.projet,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du parrainage:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du statut du parrainage' });
    }
};

module.exports = { addPendingParrainage, addParrainage };