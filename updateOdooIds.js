// updateOdooIds.js

const mongoose = require("mongoose");
require("dotenv").config(); // Pour charger les variables depuis .env

const User = require("./models/User");
const Service = require("./models/service");

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log("✅ Connecté à MongoDB");

  try {
    await User.findByIdAndUpdate("67d254f2004f9ca4277c94e4", { odooId: 5 }); // client
    await User.findByIdAndUpdate("67dcc098a6e0285dc7abaed2", { odooId: 12 }); // technicien
    await User.findByIdAndUpdate("67da88347e9d8aefcaa19120", { odooId: 3 }); // admin
    await Service.findByIdAndUpdate("67dd4df7a7260836870ac809", { odooId: 21 }); // service

    console.log("✅ odooId mis à jour !");
  } catch (err) {
    console.error("❌ Erreur de mise à jour :", err.message);
  } finally {
    mongoose.disconnect();
  }
}).catch(err => {
  console.error("❌ Erreur de connexion :", err.message);
});
