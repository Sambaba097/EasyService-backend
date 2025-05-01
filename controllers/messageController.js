const Message = require('../models/Message');
const User = require('../models/User');
const Demande = require('../models/Demande');
const mongoose = require('mongoose');

// Créer un message (version multi-destinataires)
exports.createMessage = async (req, res) => {
  try {
    const { titre, objet, contenu, destinataires, demandeId } = req.body;
    const expediteurId = req.user.id;

    // Validation de l'utilisateur
    if (!expediteurId) {
      return res.status(401).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    // Validation des destinataires
    if (!destinataires || !Array.isArray(destinataires)) {
      return res.status(400).json({ success: false, error: 'Destinataires invalides' });
    }

    // Préparer les destinataires avec leurs emails
    const preparedDestinataires = await Promise.all(
      destinataires.map(async (dest) => {
        if (mongoose.Types.ObjectId.isValid(dest)) {
          const user = await User.findById(dest);
          if (!user) throw new Error(`Utilisateur ${dest} non trouvé`);
          return {
            email: user.email,
            userId: user._id,
            userRole: user.role
          };
        } else if (typeof dest === 'string' && /\S+@\S+\.\S+/.test(dest)) {
          // Si c'est un email valide
          const user = await User.findOne({ email: dest.toLowerCase() });
          return {
            email: dest.toLowerCase(),
            userId: user?._id,
            userRole: user?.role
          };
        } else {
          throw new Error(`Destinataire invalide : ${dest}`);
        }
      })
    );

    // Validation des rôles
    if (req.user.role === 'client') {
      if (!preparedDestinataires.every(dest => dest.userRole === 'admin')) {
        return res.status(403).json({ 
          success: false, 
          error: 'Le client ne peut envoyer qu\'à l\'admin' 
        });
      }
    }
    
    if (req.user.role === 'technicien') {
      if (!preparedDestinataires.every(dest => ['admin', 'client'].includes(dest.userRole))) {
        return res.status(403).json({ 
          success: false, 
          error: 'Le technicien ne peut envoyer qu\'à l\'admin ou au client' 
        });
      }
    }

    // Validation de l'expéditeur
    const expediteur = await User.findById(expediteurId);
    if (!expediteur) {
      return res.status(404).json({ success: false, error: 'Expéditeur non trouvé' });
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
      destinataires: preparedDestinataires,
      expediteur: {
        email: expediteur.email,
        userId: expediteur._id,
        userRole: expediteur.role
      },
      demande: demandeId,
      nombreDestinataires: preparedDestinataires.length
    });

    await message.save();

    res.status(201).json({ 
      success: true, 
      message: 'Message envoyé avec succès', 
      data: message
    });

  } catch (err) {
    console.error("Erreur createMessage:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Erreur serveur lors de la création du message' 
    });
  }
};

// Récupérer un message spécifique par son ID
exports.getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;
    const userId = req.user.id;

    if(!id) {
      return res.status(400).json({ success: false, error: 'ID de message manquant' });
    }

    if(!userEmail || !userId) {
      return res.status(401).json({ success: false, error: 'Authentification requise' });
    }

    const message = await Message.findById(id)
      .populate('expediteur.userId', 'prenom nom email') // pour avoir les infos expéditeur
      .populate('destinataires.userId', 'prenom nom email'); // pour avoir les infos destinataires

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message non trouvé' });
    }

    const isAdmin = req.user.role === 'admin';
    const isSender = message.expediteur?.userId?._id?.equals(userId);
    const isRecipient = message.destinataires?.some(d => 
      (d.email && d.email === userEmail) || 
      (d.userId && d.userId._id && d.userId._id.equals(userId))
    );

    if (!isAdmin && !isSender && !isRecipient) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }

    let formattedMessage = message.toObject();

    if (isRecipient) {
      const recipientInfo = message.destinataires.find(d => 
        (d.email && d.email === userEmail) || 
        (d.userId && d.userId._id && d.userId._id.equals(userId))
      );

      if (recipientInfo) {
        formattedMessage.lu = recipientInfo.lu || false;
        formattedMessage.dateLecture = recipientInfo.dateLecture || null;
      }
    }

    res.json({ 
      success: true, 
      data: formattedMessage 
    });

  } catch (err) {
    console.error("Erreur getMessageById:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


// Messages reçus (version multi-destinataires)
exports.getReceivedMessages = async (req, res) => {
  try {

    if (!req.user || !req.user.email) {
      return res.status(401).json({ success: false, error: 'Authentification requise' });
    }
    
    const { limit, read } = req.query;
    const userEmail = req.user.email;
    
    // Recherche dans le tableau destinataires
    const query = { 
      'destinataires.email': userEmail 
    };

    if (read !== undefined) {
      query['destinataires.lu'] = read === 'true';
    }

    let messagesQuery = Message.find(query)
      .sort({ createdAt: -1 });

    if (limit) {
      messagesQuery = messagesQuery.limit(parseInt(limit));
    }

    const messages = await messagesQuery;

    // Formater les résultats pour ne retourner que les infos du destinataire concerné
    const formattedMessages = messages.map(msg => {
      const destinataireInfo = msg.destinataires.find(d => d.email === userEmail);
      return {
        ...msg.toObject(),
        lu: destinataireInfo.lu,
        dateLecture: destinataireInfo.dateLecture
      };
    });

    res.json({ 
      success: true, 
      count: formattedMessages.length, 
      data: formattedMessages 
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Marquer un message comme lu (version multi-destinataires)
exports.markAsRead = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const message = await Message.findOneAndUpdate(
      { 
        _id: req.params.id,
        'destinataires.email': userEmail 
      },
      { 
        $set: { 
          'destinataires.$.lu': true,
          'destinataires.$.dateLecture': new Date() 
        },
        $inc: { nombreLu: 1 }
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message non trouvé' });
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

// Messages envoyés (inchangé mais adapté au nouveau modèle)
exports.getSentMessages = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'Authentification requise' });
    }

    const messages = await Message.find({ 'expediteur.userId': req.user.id })
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      count: messages.length, 
      data: messages 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// Récupérer les messages non lus (version multi-destinataires)
// exports.getUnreadCount = async (req, res) => {
//   try {

//     if (!req.user || !req.user.email) {
//       return res.status(401).json({ success: false, error: 'Authentification requise' });
//     }
    
//     const userEmail = req.user.email;
    
//     const count = await Message.countDocuments({
//       'destinataires.email': userEmail,
//       'destinataires.lu': false
//     });

//     res.json({ 
//       success: true, 
//       data: { count } 
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };


// Messages pour l'admin (tous les messages)
exports.getAdminMessages = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }

    const messages = await Message.find()
      .populate('expediteur', 'prenom nom email photo role')
      .populate('destinataires', 'prenom nom email photo role')
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
      !(message.expediteur?.userId?.equals(req.user.id)) &&
      !(message.destinataires?.some(d => d.userId?.equals(req.user.id)))
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
    console.log(req.user);
    console.log(req.body);
    const count = await Message.countDocuments({
      "destinataires.email": req.user.email,
      "destinataires.lu": false
    });

    res.json({ 
      success: true, 
      data: { count } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};