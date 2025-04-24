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
   // await User.findByIdAndUpdate("67dcc098a6e0285dc7abaed2", { odooId: 10 }); // technicien

    await Service.findByIdAndUpdate("67e33e1c01c1370b76fcd839", { odooId: 1 }); // client
    await Service.findByIdAndUpdate("67e4757a9ec76e7117e0f0a6", { odooId: 2 }); // technicien
    await Service.findByIdAndUpdate("67e48c65eb628325d5ea67b1", { odooId: 3 }); // admin
    await Service.findByIdAndUpdate("67f90a49c00912ecb7b63aab", { odooId: 4 }); // service
    await Service.findByIdAndUpdate("67f93a622a6c5e8a4d0bab43", { odooId: 5 }); // service
    await Service.findByIdAndUpdate("67f93c0f2a6c5e8a4d0bab59", { odooId: 6 }); // service
    await Service.findByIdAndUpdate("67f93e582a6c5e8a4d0bab74", { odooId: 7 }); // service
    await Service.findByIdAndUpdate("67f9500a5e7925b59953cfb5", { odooId: 8 }); // service
    await Service.findByIdAndUpdate("67f950725e7925b59953cfba", { odooId: 9 }); // service
    await Service.findByIdAndUpdate("67f951065e7925b59953cfbf", { odooId: 10 }); // service
    await Service.findByIdAndUpdate("67f952a65e7925b59953cfc5", { odooId: 11 }); // service
    await Service.findByIdAndUpdate("67f9541f5e7925b59953cfd2", { odooId: 12 }); // service 
    await Service.findByIdAndUpdate("67f9a865da8ed39fb15dc200", { odooId: 13 }); // service 
    await Service.findByIdAndUpdate("67f9aab1da8ed39fb15dc211", { odooId: 14 }); // service
    await Service.findByIdAndUpdate("67f9ad02da8ed39fb15dc227", { odooId: 15 }); // service

   
    console.log("✅ odooId mis à jour !");
  } catch (err) {
    console.error("❌ Erreur de mise à jour :", err.message);
  } finally {
    mongoose.disconnect();
  }
}).catch(err => {
  console.error("❌ Erreur de connexion :", err.message);
});
