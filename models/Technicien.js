const mongoose = require('mongoose');
const User = require('./User');



const technicienSchema = new mongoose.Schema({
    telephone: { type: String, required: true },
    metier: { type: String, required: true },
    categorie: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Categorie',
      required: true 
    },
    firstConnexion: { type: Boolean, default: false}
  });

  // On ajoute les options pour la discrimination qui permet d'heriter un modél
const Technicien = User.discriminator("technicien", technicienSchema);
module.exports = Technicien;