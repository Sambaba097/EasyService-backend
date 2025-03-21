const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Routes pour l'authentification
router.post('/register', authController.register);
router.post('/login', authController.login);

// Route pour récupérer tous les utilisateurs
router.get('/users', authController.getAllUsers);

module.exports = router;