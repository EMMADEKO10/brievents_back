const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, 'pdfs');
    } else {
      cb(null, 'images');
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
  
});

const upload = multer({ storage: storage });

module.exports = upload;


// // Configure Cloudinary
// cloudinary.config({
//   cloud_name:'sotradonsAPI',
//   api_key:'774968294321134',
//   api_secret: '3M2Ak3_5IPmYHdqlCTulI8G-gmE'
// });