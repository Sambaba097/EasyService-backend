const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3000;
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');



// Middleware
app.use(express.json()); // permet de lire le JSON dans les requetes
app.use(express.urlencoded({ extended: true })); // permet de lire le JSON dans les requetes

app.use(cors()); // permet d'accéder à l'API depuis le frontend

// connexion à MongoDB

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connexion à MongoDB réussie !'))
 .catch((err) => console.error('Erreur de connexion à MongoDB :', err));

 // Route de base pour tester l'API
app.get('/', (req, res) => {
    res.send('Bienvenue sur l\'API de gestion de service !');
});

// Routes d'authentification
app.use('/api/auth', authRoutes);

// Routes des dashboards
app.use('/dashboard', dashboardRoutes);

// Démarrer le serveur

app.listen(PORT, () => console.log(`L'API est démarrée sur le port ${PORT}`));