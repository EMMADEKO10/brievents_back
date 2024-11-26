const dotenv = require("dotenv");
// const Payment = require("../Models/payment.model");
const {User} = require("../Models/user.model");
// const mongoose = require('mongoose');
// const {createCreditNotification} = require("../notofications/notification.controller")
const { PaymentPack, PendingPaymentPack } = require("../Models/paymentPack.model");

dotenv.config();

const addPendingPaymentPack = async (req, res) => {
    const { amount, email, telephone, user, reference, pack } = req.body;
    console.log("amount, email, telephone, user ", amount, email, telephone, user);
    
    try {
      if (!user) {
        throw new Error("User ID is required");
      }
    
    if (!pack) {
        throw new Error("Pack ID is required");
      }
      const newPaymentPack = new PendingPaymentPack({
        amount,
        email,
        reference,
        user,
        telephone,
        pack
      });
      
      await newPaymentPack.save();
      
      res.json({ message: "PaymentPack pending", reference });
    } catch (error) {
      console.error("Error initiating paymentPack:", error);
      res.status(400).json({ error: error.message || "An error occurred while initiating the paymentPack" });
    }
};
// ---------------------------------------------------------------------
 const addPaymentPack = async (req, res) => {
    try {
      const { reference } = req.body;
    console.log(`Recherche du paymentPack avec la référence: ${reference}`);
      // Vérifier si le paymentPack existe déjà
      let paymentPack = await PaymentPack.findOne({ reference });
      if (paymentPack) {
        console.log(`PaymentPack déjà existant dans PaymentPack:`, paymentPack);
        return res.json({
          reference: paymentPack.reference,
          amount: paymentPack.amount,
          email: paymentPack.email,
          status: paymentPack.status,
          transactionId: paymentPack.maxiCashTransactionId
        });
      }
      
      const pendingPaymentPack = await PendingPaymentPack.findOne({ reference });
      if (!pendingPaymentPack) {
            console.log(`Aucun paymentPack en attente trouvé pour la référence: ${reference}`);
        return res.status(404).json({ error: 'PaymentPack non trouvé' });
      }

      // Utiliser findOneAndUpdate avec upsert pour éviter les doublons
      const newPaymentPack = await PaymentPack.findOneAndUpdate(
        { reference: pendingPaymentPack.reference },
        {
          user: pendingPaymentPack.user,
          amount: pendingPaymentPack.amount,
          email: pendingPaymentPack.email,
          pack: pendingPaymentPack.pack,
          maxiCashTransactionId: pendingPaymentPack.maxiCashTransactionId,
          status: 'completed', // Ajoutez un statut si nécessaire
        },
        { upsert: true, new: true }
      );

      console.log(`Nouveau paymentPack crédit ou mis à jour:`, newPaymentPack.user, pendingPaymentPack.user);
       const user = await User.findById(newPaymentPack.user)  
      console.log(`is à jour:`, user.name);
        const values =  newPaymentPack.amount;
      console.log(`Nouv mis à jour:`, values);
        // Créer une notification de crédit à l'utilisateur créé ou mis à jour
        // Utiliser le nom de l'utilisateur pour la création de la notification
      const message = `Demande de crédit pour un montant de €${values}`
        // await createCreditNotification(message, user.name );    
        // Supprimer le paiement en attente seulement après avoir réussi à créer/mettre à jour le paiement
      await PendingPaymentPack.deleteOne({ reference: pendingPaymentPack.reference });
      console.log(`PendingPaymentPack supprimé`);
      
      res.json({
        reference: newPaymentPack.reference,
        amount: newPaymentPack.amount,
        email: newPaymentPack.email,
        status: newPaymentPack.status,
        transactionId: newPaymentPack.maxiCashTransactionId,
        // projet: newPaymentPack.projet,
      });
    } catch (error) {
     console.error('Erreur lors de la mise à jour du statut du paymentPack:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du statut du paymentPack' });
    }
};

module.exports = { addPendingPaymentPack, addPaymentPack };