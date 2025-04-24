const Message = require('../models/Message');
const User = require('../models/User');
const Demande = require('../models/Demande');

// Créer un message
exports.createMessage = async (req, res) => {
  try {
    const { titre, objet, contenu, destinataireId, demandeId } = req.body;
    const expediteurId = req.user.id;

    // Validation du destinataire
    const destinataire = await User.findById(destinataireId);
    if (!destinataire) {
      return res.status(404).json({ success: false, error: 'Destinataire non trouvé' });
    }

    // Validation de la demande si fournie
    if (demandeId) {
      const demande = await Demande.findById(demandeId);
      if (!demande) {
        return res.status(404).json({ success: false, error: 'Demande non trouvée' });
      }
    }

    const message = new Message({ 
      titre, 
      objet, 
      contenu, 
      destinataire: destinataireId, 
      expediteur: expediteurId,
      demande: demandeId 
    });

    await message.save();

    // Populate pour la réponse
    const populatedMessage = await Message.findById(message._id)
      .populate('expediteur', 'prenom nom email photo')
      .populate('destinataire', 'prenom nom email photo');

    res.status(201).json({ 
      success: true, 
      message: 'Message envoyé avec succès', 
      data: populatedMessage 
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Messages reçus avec filtres selon le rôle
exports.getReceivedMessages = async (req, res) => {
  try {
    const { limit, read } = req.query;
    const query = { destinataire: req.user.id };

    if (read !== undefined) {
      query.lu = read === 'true';
    }

    let messagesQuery = Message.find(query)
      .populate('expediteur', 'prenom nom email photo role')
      .sort({ date: -1 });

    if (limit) {
      messagesQuery = messagesQuery.limit(parseInt(limit));
    }

    const messages = await messagesQuery;

    res.json({ 
      success: true, 
      count: messages.length, 
      data: messages 
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Messages envoyés
exports.getSentMessages = async (req, res) => {
  try {
    const messages = await Message.find({ expediteur: req.user.id })
      .populate('destinataire', 'prenom nom email photo role')
      .sort({ date: -1 });

    res.json({ 
      success: true, 
      count: messages.length, 
      data: messages 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Messages pour l'admin (tous les messages)
exports.getAdminMessages = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }

    const messages = await Message.find()
      .populate('expediteur', 'prenom nom email photo role')
      .populate('destinataire', 'prenom nom email photo role')
      .sort({ date: -1 });

    res.json({ 
      success: true, 
      count: messages.length, 
      data: messages 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Messages liés à une demande spécifique
exports.getMessagesByDemande = async (req, res) => {
  try {
    const { demandeId } = req.params;

    // Vérifier l'accès à la demande
    const demande = await Demande.findById(demandeId);
    if (!demande) {
      return res.status(404).json({ success: false, error: 'Demande non trouvée' });
    }

    // Seuls le client, le technicien ou l'admin peuvent voir ces messages
    if (
      req.user.role !== 'admin' &&
      !demande.client.equals(req.user.id) &&
      !demande.technicien.equals(req.user.id)
    ) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }

    const messages = await Message.find({ demande: demandeId })
      .populate('expediteur', 'prenom nom email photo role')
      .populate('destinataire', 'prenom nom email photo role')
      .sort({ date: -1 });

    res.json({ 
      success: true, 
      count: messages.length, 
      data: messages 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Marquer un message comme lu
exports.markAsRead = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { lu: true, dateLecture: new Date() },
      { new: true }
    )
    .populate('expediteur', 'prenom nom email photo role');

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message non trouvé' });
    }

    // Vérifier que l'utilisateur est bien le destinataire
    if (!message.destinataire.equals(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }

    res.json({ 
      success: true, 
      message: 'Message marqué comme lu', 
      data: message 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Supprimer un message
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message non trouvé' });
    }

    // Seul l'expéditeur, le destinataire ou un admin peut supprimer
    if (
      req.user.role !== 'admin' &&
      !message.expediteur.equals(req.user.id) &&
      !message.destinataire.equals(req.user.id)
    ) {
      return res.status(403).json({ success: false, error: 'Autorisation refusée' });
    }

    await message.deleteOne();

    res.json({ 
      success: true, 
      message: 'Message supprimé avec succès' 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Récupérer les messages non lus (pour notifications)
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      destinataire: req.user.id,
      lu: false
    });

    res.json({ 
      success: true, 
      data: { count } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};