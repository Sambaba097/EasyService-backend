const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  tarif: { type: Number, required: true },
  duree: { type: Number, required: true },
  uniteDuree: { type: String, required: true, enum: ["jours", "heures", "minutes"] },
  categorie: { type: mongoose.Schema.Types.ObjectId, ref: "Categorie", required: true }, 
  image: { type: String, required: true },
  createDate: { type: Date, default: Date.now },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

module.exports = mongoose.model("Service", ServiceSchema);
