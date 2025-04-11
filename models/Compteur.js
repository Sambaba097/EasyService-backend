// models/Compteur.js
const mongoose = require('mongoose');

const compteurSchema = new mongoose.Schema({
  nom: { type: String, required: true, unique: true },
  valeur: { type: Number, default: 0 },
});

module.exports = mongoose.model('Compteur', compteurSchema);
