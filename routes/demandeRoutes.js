
const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/authMiddleware');
const demandeController = require('../controllers/demandeController');
const router = express.Router();

// Routes protégées par l'authentification et vérification du rôle
router.post("/", authenticate, roleMiddleware(['client']), demandeController.createDemande);
router.put("/:id", authenticate, roleMiddleware(['client', 'technicien']), demandeController.updateDemande);
router.delete("/:id", authenticate, roleMiddleware(['admin']), demandeController.deleteDemande);

router.post('/assigner', authenticate, roleMiddleware(['admin']), demandeController.assignerDemande);
router.put('/terminer/:demandeId', authenticate, roleMiddleware(['technicien']), demandeController.terminerDemande);

// Routes accessibles par tous
router.get("/:id", demandeController.getDemandeById);
router.get("/", demandeController.getAllDemandes);

module.exports = router;
