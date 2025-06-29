const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); 

// Créez une instance d'Express
const app = express();

// Utilisation de CORS et express.json() pour gérer les requêtes
const corsOptions = {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://easyservice-29e5.onrender.com",
      "https://easy-service-frontend-7jhw.vercel.app", // Nouveau lien et en production
      "https://easy-service-frontend.vercel.app",
      "https://easyservice-frontend-l01x.onrender.com",
      "https://easyservice-zhmc.onrender.com",
      "https://easyservice.vercel.app",
    ],
    credentials: true,
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "sessionId",
    ],
    exposedHeaders: ["sessionId"],
    methods: "GET,PUT,POST,DELETE",
    preflightContinue: false,
  };
app.use(cors(corsOptions));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
// Configurer les en-tetes CORS pour les fentre popups
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

// Connexion à MongoDB
const MONGO_URI = process.env.MONGO_URI 

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connecté à MongoDB Atlas"))
    .catch(err => {
        console.log("🔴 Erreur de connexion à MongoDB:", err);
        process.exit(1);
    });

// Importation des modèles
require("./models/planification");  
require("./models/service");  
require("./models/categorie");

// Routes de l'API 
const planificationRoutes = require("./routes/planificationRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const categorieRoutes = require("./routes/categorieRoutes");
const factureRoutes = require("./routes/factureRoutes");
const demandeRoutes = require("./routes/demandeRoutes");
const avisRoutes = require("./routes/avisRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const messageRoutes = require("./routes/messageRoutes");
const searchRoutes = require('./routes/searchRoutes');

// Utilisation des routes
app.use("/api/planifications", planificationRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/categories", categorieRoutes);
app.use("/api/demandes", demandeRoutes);
app.use("/api/factures", factureRoutes);
app.use("/api/avis", avisRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use('/api/search', searchRoutes);

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    console.error("❌ Erreur :", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Erreur interne du serveur"
    });
});

// Route de base pour tester l'API
app.get("/", (req, res) => {
    res.send("Bienvenue sur l'API de gestion de service!");
});

// Lancer le serveur sur le port 5000
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
