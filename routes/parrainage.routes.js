// routes/parrainage.routes.js
const express = require('express');
const parrainageRouter = express.Router();
const { addPendingParrainage, addParrainage } = require('../Controllers/parrainage.controller');
parrainageRouter.post('/addPendingParrainage', addPendingParrainage);
parrainageRouter.post('/addParrainage', addParrainage);

module.exports = parrainageRouter;