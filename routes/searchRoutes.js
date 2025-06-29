const express = require('express');
const router = express.Router();

const Service = require('../models/service');
const Message = require('../models/Message');
const Avis = require('../models/Avis');
const Demande = require('../models/Demande');
const User = require('../models/User');

// Route de recherche
router.get('/', async (req, res) => {
  const query = req.query.q;
  const email = req.query.user;

  const user = await User.findOne({ email });
  const role = user ? user.role : null;
  const userId = user ? user._id : null;

  if (!query) {
    return res.status(400).json({ message: 'Aucune requête fournie' });
  }

  try {
    let allResults = [];
    
    // Recherche des messages avec population
    const messages = await Message.find({
      $or: [
        { nom: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { contenu: { $regex: query, $options: 'i' } }
      ],
      $or: [
        { 'destinataires.email': email },
        { 'expediteur.email': email }
      ]
    })
    .populate('expediteur') // Population de l'expéditeur
    .populate('destinataires') // Population des destinataires
    .lean();

    if (role === 'client') {
      const services = await Service.find({
        $or: [
          { nom: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ],
      })
      .populate('admin')
      .populate('categorie')
      .lean();

      const demandes = await Demande.find({
        $or: [
          { numeroDemande: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ],
        client: userId
      })
      .populate('client')
      .populate('technicien')
      .populate('service')
      .lean();

      const avis = await Avis.find({
        $or: [
          { commentaire: { $regex: query, $options: 'i' } },
        ],
        client: userId
      })
      .populate({
        path: 'service',
        populate: {
          path: 'categorie' // Ceci va peupler la catégorie dans le service
        }
      })
      .populate('demande')
      .populate('technicien')
      .lean();

      allResults = [
        ...services.map(item => ({ ...item, type: 'service' })),
        ...demandes.map(item => ({ ...item, type: 'demande' })),
        ...messages.map(item => ({ ...item, type: 'message' })),
        ...avis.map(item => ({ ...item, type: 'avis' }))
      ];
    } 
    else if (role === 'technicien') {
      const demandes = await Demande.find({
        $or: [
          { numeroDemande: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ],
        technicien: userId
      })
      .populate('client')
      .populate('technicien')
      .populate('service')
      .lean();

      allResults = [
        ...demandes.map(item => ({ ...item, type: 'demande' })),
        ...messages.map(item => ({ ...item, type: 'message' }))
      ];
    } 
    else if (role === 'admin') {
      const services = await Service.find({
        $or: [
          { nom: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      })
      .populate('categorie')
      .lean();

      const demandes = await Demande.find({
        $or: [
          { numeroDemande: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      })
      .populate('client')
      .populate('technicien')
      .populate('service')
      .lean();

      const avis = await Avis.find({
        $or: [
          { commentaire: { $regex: query, $options: 'i' } },
        ]
      })
      .populate({
        path: 'service',
        populate: {
          path: 'categorie' // Ceci va peupler la catégorie dans le service
        }
      })
      .populate('client')
      .populate('demande')
      .populate('technicien')
      .lean();

      allResults = [
        ...services.map(item => ({ ...item, type: 'service' })),
        ...demandes.map(item => ({ ...item, type: 'demande' })),
        ...messages.map(item => ({ ...item, type: 'message' })),
        ...avis.map(item => ({ ...item, type: 'avis' }))
        // ...avisFormatted
      ];
    }

    res.json(allResults);
  } catch (err) {
    console.error('Erreur lors de la recherche :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;