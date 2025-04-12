const express = require('express');
const router = express.Router();

const Service = require('../models/service');
const Message = require('../models/Message');
const Avis = require('../models/Avis');

// Route de recherche
router.get('/', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ message: 'Aucune requête fournie' });
  }

  try {
    const services = await Service.find({
      $or: [
        { titre: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });

    const messages = await Message.find({
      $or: [
        { nom: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { contenu: { $regex: query, $options: 'i' } }
      ]
    });

    const avis = await Avis.find({
      $or: [
        { nom: { $regex: query, $options: 'i' } },
        { commentaire: { $regex: query, $options: 'i' } }
      ]
    });

    // Fusionner tous les résultats et indiquer le type
    const allResults = [
      ...services.map(item => ({ ...item._doc, type: 'service' })),
      ...messages.map(item => ({ ...item._doc, type: 'message' })),
      ...avis.map(item => ({ ...item._doc, type: 'avis' }))
    ];

    res.json(allResults);
  } catch (err) {
    console.error('Erreur lors de la recherche :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
