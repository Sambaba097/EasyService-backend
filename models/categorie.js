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
    default: Date.now,  
  },
});


const Categorie = mongoose.model("Categorie", categorieSchema);

module.exports = Categorie;
