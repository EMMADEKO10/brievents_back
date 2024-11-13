
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const corsOptions = require("./configs/corsOptions");

// Routes
const sponsorRouter = require('./routes/sponsor.routes');
const prestataireRouter = require('./routes/prestataire.routes');
const eventRouter = require("./routes/event.routes")
const organizerRouter = require("./routes/organizer.routes")
const userRouter = require("./routes/users.routes")
const parrainageRouter = require("./routes/parrainage.routes")
// ---------------------------
const app = express();
const server = http.createServer(app);

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use('/images', express.static(path.join(__dirname, 'public', 'Images')));
// Ajouter cette ligne après les autres app.use() pour les fichiers statiques

// Routes

app.use('/api/sponsor', sponsorRouter);
app.use('/api/organizer', organizerRouter);
app.use('/api/event', eventRouter);
app.use('/api/login', userRouter);
app.use('/api/prestataire', prestataireRouter);
app.use('/api/parrainage', parrainageRouter);

// Route racine
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(`Erreur serveur: ${err.message}`);
});
// ---------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connecté à MongoDB'))
  .catch((err) => console.error('Erreur de connexion à MongoDB:', err));

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err);
  process.exit(1);
});
// ---------------------------------------------------------------------------------------------------------