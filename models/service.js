const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  tarif: { type: Number, required: true },
  duree: { type: Number, required: true },
  uniteDuree: { type: String, required: true, enum: ["jours", "heures", "minutes"] }, // Ajout du champ manquant
  categorie: { type: mongoose.Schema.Types.ObjectId, ref: "Categorie", required: true }, // Doit être un ID
  image: { type: String }
});

module.exports = mongoose.model("Service", ServiceSchema);
