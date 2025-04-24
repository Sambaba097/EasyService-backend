
const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/authMiddleware');
const demandeController = require('../controllers/demandeController');
const router = express.Router();

// Routes protégées par l'authentification et vérification du rôle
router.post("/", authenticate, roleMiddleware(['client']), demandeController.createDemande);
router.put("/:id", authenticate, roleMiddleware(['admin', 'technicien']), demandeController.updateDemande);
router.delete("/:id", authenticate, roleMiddleware(['admin']), demandeController.deleteDemande);

// Routes pour assigner une demande à un technicien
router.post('/assigner', authenticate, roleMiddleware(['admin']), demandeController.assignerDemande);

// Routes pour changer le statut et l'état d'exécution d'une demande 
router.put('/commencer/:demandeId',authenticate, roleMiddleware(['technicien']), demandeController.commencerDemande);
router.put('/terminer/:demandeId', authenticate, roleMiddleware(['technicien']), demandeController.terminerDemande);

// Récupérer les demandes d'un client spécifique
router.get('/client/:clientId', demandeController.getDemandesByClient);

// Récupérer les demandes d'un technicien spécifique
router.get('/technicien/:technicienId', demandeController.getDemandesByTechnicien);

// Routes accessibles par tous
router.get("/:id", demandeController.getDemandeById);
router.get("/", demandeController.getAllDemandes);

module.exports = router;
