
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Définition du dossier de stockage en fonction de l'environnement
const getUploadFolder = () => {
  if (process.env.NODE_ENV === 'dev') {
    return 'brievent/dev';
  } else {
    return 'brievent/prod';
  }
};

module.exports = {
  cloudinary,
  getUploadFolder,
};
