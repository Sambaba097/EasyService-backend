const Message = require('../models/Message');

// Créer un message
exports.createMessage = async (req, res) => {
  try {
    const { titre, objet, contenu, destinataire } = req.body;

    // L'expéditeur est l'utilisateur connecté
    const expediteur = req.user.id;

    const message = new Message({ titre, objet, contenu, destinataire, expediteur });
    await message.save();

    res.status(201).json({ success: true, message: 'Message envoyé avec succès', data: message });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Récupérer tous les messages reçus par l'utilisateur connecté
exports.getMessagesRecus = async (req, res) => {
  try {
    const messages = await Message.find({ destinataire: req.user.id })
      .populate('expediteur', 'nom email') 
      .sort({ date: -1 }); // Tri du plus récent au plus ancien

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Récupérer tous les messages envoyés par l'utilisateur connecté
exports.getMessagesEnvoyes = async (req, res) => {
  try {
    const messages = await Message.find({ expediteur: req.user.id })
      .populate('destinataire', 'nom email') // 
      .sort({ date: -1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Détails d’un message (accessible seulement si on est destinataire ou expéditeur)
exports.getMessageById = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('expediteur', 'nom email')
      .populate('destinataire', 'nom email');

    if (!message) return res.status(404).json({ message: 'Message non trouvé' });

    // Vérifie que l’utilisateur est soit l'expéditeur soit le destinataire
    if (
      !message.expediteur._id.equals(req.user.id) &&
      !message.destinataire._id.equals(req.user.id)
    ) {
      return res.status(403).json({ message: "Accès non autorisé à ce message" });
    }

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Supprimer un message (seul l’expéditeur peut supprimer)
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) return res.status(404).json({ message: 'Message non trouvé' });

    // Vérifie que l'utilisateur est bien l'expéditeur
    if (!message.expediteur.equals(req.user.id)) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres messages' });
    }

    await message.deleteOne();
    res.json({ message: 'Message supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
