const mongoose = require("mongoose");

const categorieSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    unique: true, // Chaque catégorie doit être unique
    trim: true,  // Enlève les espaces au début et à la fin
  },
  dateCreation: {
    type: Date,
    default: Date.now,  // La date de création est définie automatiquement sur la date actuelle
  },
});

// Le nom du modèle doit commencer par une majuscule par convention
const Categorie = mongoose.model("Categorie", categorieSchema);

module.exports = Categorie;
