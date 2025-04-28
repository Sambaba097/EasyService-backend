const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'technicien', 'client'], default: 'client' },
  image: {
    url: String, default: '', publicId: String
  },

  odooId: {
    type: Number // l'ID entier d'Odoo
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

// Hasher le mot de passe avant de sauvegarder l'utilisateur
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);