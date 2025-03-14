const express = require('express');
const router = express.Router();
const { creerFacture, recupererFactures } = require('../controllers/factureController');

router.post('/', creerFacture);
router.get('/', recupererFactures);

module.exports = router;
