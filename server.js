const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); 

// Créez une instance d'Express
const app = express();

// Utilisation de CORS et express.json() pour gérer les requêtes
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Connexion à MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Fatima:easyservice@cluster0.6xoab.mongodb.net/EasyService?retryWrites=true&w=majority&appName=Cluster";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
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

// Utilisation des routes
app.use("/api/planifications", planificationRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/categories", categorieRoutes);
app.use("/api/demandes", demandeRoutes);
app.use("/api/factures", factureRoutes);
app.use("/api/avis", avisRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    console.error("❌ Erreur :", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Erreur interne du serveur"
    });
});

// Lancer le serveur sur le port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
