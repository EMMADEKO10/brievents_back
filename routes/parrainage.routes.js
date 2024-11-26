// routes/parrainage.routes.js
const express = require('express');
const parrainageRouter = express.Router();
const { addPendingParrainage, addParrainage } = require('../Controllers/parrainage.controller');
const { addPendingPaymentPack, addPaymentPack } = require('../Controllers/paymentPack.controller');
parrainageRouter.post('/addPendingParrainage', addPendingParrainage);
parrainageRouter.post('/addParrainage', addParrainage);

parrainageRouter.post('/addPendingPaymentPack', addPendingPaymentPack);
parrainageRouter.post('/addPaymentPack', addPaymentPack);

module.exports = parrainageRouter;