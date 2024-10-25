
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const chatController = require('./Controllers/chat.controller');
const corsOptions = require("./configs/corsOptions");

// Routes
const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/users.routes');
const eventRouter = require('./routes/events.routes');
const companyRouter = require('./routes/company.routes');
const essaiRouter = require('./routes/essaieRouter.routes');
const packRoutes = require('./routes/pack.routes');
const actualiteRouter = require('./routes/actualite.routes');
const advisorRouter = require('./routes/advisor.routes');
const chatRoutes = require('./routes/chat.routes');
const RefPayementRouter = require('./routes/payReference.routes');
const pendingPayementRouter = require('./routes/pendingPayment.routes');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Ajustez ceci en production
    methods: ['GET', 'POST']
  }
});

app.use(cors(corsOptions));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use('/images', express.static(path.join(__dirname, 'public', 'Images')));
// Ajouter cette ligne après les autres app.use() pour les fichiers statiques

// Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/company', companyRouter);
app.use('/api/event', eventRouter);
app.use('/api/essaie', essaiRouter);
app.use('/api/pack', packRoutes);
app.use('/api/actualites', actualiteRouter);
app.use('/api/advisor', advisorRouter);
app.use('/api/payment', pendingPayementRouter);
app.use('/api/refpayment', RefPayementRouter);
app.use('/api/chat', chatRoutes);

// Route racine
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
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
// ----------------------------------------------------------------------------------------------------------