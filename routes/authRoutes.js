const express = require('express');
const authController = require('../controllers/authController');
const technicienController = require('../controllers/technicienController');

const router = express.Router();

// Routes pour l'authentification
router.post('/register', authController.register);
router.post('/login', authController.login);

// Routes pour crée des techniciens
router.post('/creer/technicien', technicienController.createTechnicien);

// Routes pour récupérer tous les techniciens
router.get('/all/techniciens', technicienController.getAlltechniciens);

// Route pour récupérer tous les utilisateurs
router.get('/users', authController.getAllUsers);

// Route pour récupérer les infos d'un utilisateur
router.get('/users/:id',authController.getUser);

// Mettre à jours les infos d'un utilisateur
router.put('/users/:id',authController.updateUser);

module.exports = router;