const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema({
  titre: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  objet: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  contenu: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  // Pour gérer plusieurs destinataires
  destinataires: [{
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    lu: {
      type: Boolean,
      default: false
    },
    dateLecture: {
      type: Date
    }
  }],
  expediteur: {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  demande: {
    type: Schema.Types.ObjectId,
    ref: 'Demande'
  },
  // Statistiques de lecture
  nombreDestinataires: {
    type: Number,
    default: 0
  },
  nombreLu: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // Ajoute automatiquement createdAt et updatedAt
});

// Index pour optimiser les requêtes
messageSchema.index({ 'destinataires.email': 1 });
messageSchema.index({ 'expediteur.userId': 1 });
messageSchema.index({ demande: 1 });

module.exports = mongoose.model('Message', messageSchema);