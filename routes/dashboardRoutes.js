const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware'); // Importation de `authenticate`

// Dashboard Technicien
router.get('/technicien', authenticate, (req, res) => {
  res.send('Bienvenue sur le dashboard Technicien');
});

// Dashboard Client
router.get('/client', authenticate, (req, res) => {
  res.send('Bienvenue sur le dashboard Client');
});

// Dashboard Admin
router.get('/admin', authenticate, (req, res) => {
  res.send('Bienvenue sur le dashboard Admin');
});

module.exports = router;