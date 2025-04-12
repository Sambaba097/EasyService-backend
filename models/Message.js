const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema({
  titre: {
    type: String,
    required: true,
    trim: true
  },
  objet: {
    type: String,
    required: true,
    trim: true
  },
  contenu: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  destinataire: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expediteur: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('Message', messageSchema);
