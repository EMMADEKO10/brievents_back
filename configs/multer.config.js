// const multer = require('multer');
// const path = require('path');

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.mimetype === 'application/pdf') {
//       cb(null, 'pdfs');
//     } else {
//       cb(null, 'public/images');
//     }
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
  
// });

// const upload = multer({ storage: storage });

// module.exports = upload;



const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Assurez-vous que les dossiers existent
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDir('public/images');
ensureDir('pdfs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, 'pdfs');
    } else {
      cb(null, 'public/images');
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
