const express = require('express');
const actualiteRouter = express.Router();
const { 
  createActualite, 
  getAllActualites, 
  getActualiteById, 
  updateActualite, 
  deleteActualite 
} = require('../Controllers/actualite.controller');
const upload = require('../configs/multer.config');

actualiteRouter.post('/', upload.single('imageUrl'), createActualite);
actualiteRouter.get('/', getAllActualites);
actualiteRouter.get('/:id', getActualiteById);
actualiteRouter.put('/:id', upload.single('imageUrl'), updateActualite);
actualiteRouter.delete('/:id', deleteActualite);

module.exports = actualiteRouter;