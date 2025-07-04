const express = require('express');
const authController = require('../controllers/authController');
const technicienController = require('../controllers/technicienController');
const { uploadService } = require('../config/multer');
const { roleMiddleware, authenticate } = require('../middleware/authMiddleware');
const router = express.Router();
const { uploadProfile } = require("../config/multer"); 

// Routes pour l'authentification
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/login/google', authController.googleLogin);

// Routes pour crée des techniciens
router.post('/creer/technicien', technicienController.createTechnicien);

// Routes pour récupérer tous les techniciens
router.get('/all/techniciens', technicienController.getAlltechniciens);

// Route pour modifier le rôle en technicien
router.put('/techniciens/:id', technicienController.updateToTechnicien);

// Route pour récupérer tous les utilisateurs
router.get('/users', authController.getAllUsers);

// Route pour récupérer l'utilisateur connecté
router.get('/users/me', authenticate, authController.getCurrentUser);

// Route pour récupérer les infos d'un utilisateur
router.get('/users/:id',authController.getUser);

// Mettre à jours les infos d'un utilisateur depuis le profil
router.put('/users/:id', uploadProfile.single('image'), authController.updateUserProfile);

// Mise à jours pour le changement de rôles
router.put('/users/:id/change-role', authenticate, roleMiddleware(['admin']), authController.changeUserRole);

// Routes pour bloquer/débloquer (protégées, réservées aux admins)
router.put('/users/:id/block', authenticate, roleMiddleware(['admin']), authController.blockUser);
router.put('/users/:id/unblock',authenticate, roleMiddleware(['admin']), authController.unblockUser);

// Route pour mot de passe oublié
router.post('/forgot-password', authController.forgotPassword);
// Route pour réinitialiser le mot de passe
router.post('/reset-password', authController.resetPassword);
// ajouter un image de profil
router.post('/profil/image', authController.updateProfilePicture, uploadService.single('image'));


module.exports = router;