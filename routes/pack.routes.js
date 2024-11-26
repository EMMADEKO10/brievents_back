const packRouter = require('express').Router();
const packController = require('../Controllers/pack.controller');
// const auth = require('../middleware/auth');

// Routes publiques
packRouter.get('/', packController.getAllPacks);
packRouter.get('/:id', packController.getPackById);
packRouter.get('/event/:eventId/packs', packController.getPacksByEvent);

// Routes protégées (nécessitent une authentification)
// packRouter.post('/pack', auth, packController.createPack);
packRouter.post('/', packController.createPack);
packRouter.put('/:id',  packController.updatePack);
packRouter.delete('/:id',  packController.deletePack);

module.exports = packRouter;
