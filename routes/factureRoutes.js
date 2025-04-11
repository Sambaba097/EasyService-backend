// factureRoutes.js

const express = require('express');
const router = express.Router();
const factureController = require('../controllers/factureController');

// Middleware d'authentification
const { authenticate } = require('../middleware/authMiddleware');

router.post('/creer/facture', authenticate, factureController.createFacture);
router.get('/afficher/facture/:id', factureController.afficherFacture);
router.get('/afficher/facture', factureController.afficherToutesLesFactures);
router.put('/modifier/facture/:id', authenticate, factureController.mettreAJourFacture);
router.delete('/supprimer/facture/:id', authenticate, factureController.supprimerFacture);

module.exports = router;
