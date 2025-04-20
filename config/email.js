const nodemailer = require('nodemailer');

// 1. Configuration du transporteur (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // email Gmail
    pass: process.env.EMAIL_PASSWORD, // mot de passe d'application
  },
});

// 2. Test de la connexion SMTP 
transporter.verify((error) => {
  if (error) {
    console.error('Erreur SMTP:', error);
  } else {
    console.log('Serveur SMTP prêt');
  }
});

module.exports = transporter;