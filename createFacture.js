// createFacture.js
require('dotenv').config();
const mongoose = require('mongoose');
const Facture = require('./models/Facture'); // adapte ce chemin si nécessaire

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const nouvelleFacture = new Facture({
            montant: 5000,
            service: "67e33e1c01c1370b76fcd839",
            technicien: "67dcc098a6e0285dc7abaed2",
            client: "680ccb0eba14d3692ab53945",
            admin: "67da88347e9d8aefcaa19120",
            refDemande: "65f3abc1234567890abcdef1"
        });

        await nouvelleFacture.save();
        console.log("📄 Facture enregistrée avec succès");
        mongoose.disconnect();
    })
    .catch(err => {
        console.error("💥 Erreur lors de l'enregistrement :", err.message);
        mongoose.disconnect();
    });
