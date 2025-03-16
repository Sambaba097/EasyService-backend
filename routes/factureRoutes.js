const express = require('express');
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");  
const { creerFacture, recupererFactures } = require('../controllers/factureController');

router.post('/', authenticate, creerFacture);
router.get('/', authenticate, recupererFactures);
router.get('/:id', authenticate, recupererFactureById);

module.exports = router;
