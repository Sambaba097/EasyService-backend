const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

// Créez une instance d'Express
const app = express();

// Utilisation de CORS et body-parser pour gérer les requêtes
app.use(cors());
app.use(bodyParser.json());

// Connexion à MongoDB
mongoose.connect("mongodb://localhost:27017/EasyService", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("✅Connecté à MongoDB"))
    .catch(err => console.log("🔴Erreur de connexion à MongoDB:", err));

// Importation des modèles
require("./models/planification");  
require("./models/service");  
require("./models/categorie");  

// Définir les routes de l'API
const planificationRoutes = require("./routes/planificationRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const categorieRoutes = require("./routes/categorieRoutes");
const factureRoutes = require("./routes/factureRoutes");
const demandeRoutes = require("./routes/demandeRoutes");
const avisRoutes =require("./routes/avisRoutes")

// Routes API
app.use("/api/planifications", planificationRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/categories", categorieRoutes);
app.use("/api/demandes", demandeRoutes);
app.use("/api/factures",factureRoutes)
app.use("/api/avis",avisRoutes)

// Lancer le serveur sur le port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});