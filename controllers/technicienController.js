const mongoose = require('mongoose');
const Technicien = require('../models/Technicien');
const User = require('../models/User');
const Demande = require('../models/Demande');
const { createOdooContact } = require('../utils/odoo');

exports.createTechnicien = async (req, res) => {
    try {
      const { prenom, nom, telephone, metier, categorie, email, password  } = req.body;

      const existingTechnicien = await Technicien.findOne({ email });
      if (existingTechnicien) {
        return res.status(400).json({ message: "Cet email est deja utilisé." });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Cet email est deja utilisé." });
      }

      // 👉 Appel à Odoo pour créer un contact
      const odooId = await createOdooContact({ prenom, nom, email, password, role: 'technicien' });
      
      const technicien = new Technicien({
        prenom,
        nom,
        telephone,
        metier,
        categorie: categorie,
        email,
        password,
        odooId: odooId, 
        role: 'technicien' 
      });

      await technicien.save();
      
          res.status(201).json({message: 'Technicien crée avec succés', technicien});
        } catch (err) {
          res.status(400).json({ error: err.message });
        }
      };

// Récupérer tous les Techniciens
exports.getAlltechniciens = async (req, res) => {
  try {
    // Récupérer tous les techniciens depuis la base de données
    const techniciens = await Technicien.find({}).select("-password");

    // Renvoyer la liste des techniciens
    res.status(200).json({ message: 'Liste des techniciens récupérée avec succès', techniciens });
  } catch (err) {
    console.error('Erreur lors de la récupération des techniciens :', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des techniciens.', error: err.message });
  }
};

// De Client ou Admin vers Technicien
exports.updateToTechnicien = async (req, res) => {
  const { id } = req.params;
  const { telephone, metier, categorie } = req.body.body || req.body;

  try {
    // 1. Trouver l'utilisateur avant suppression pour récupérer ses données
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Suprimer tous les demandes de l'utilisateur
    const demandes = await Demande.find({ user: id });
    await Demande.deleteMany({ user: id });

    // 2. Supprimer l'utilisateur
    await User.findByIdAndDelete(id);
    
    // 3. Créer le technicien avec les mêmes identifiants
    const technicien = await Technicien.create({
      _id: new mongoose.Types.ObjectId(),
      prenom: user.prenom,
      nom: user.nom,
      email: user.email, // Conserver le même email
      password: "passer",
      telephone,
      metier,
      categorie,
      role: 'technicien',
      createdAt: user.createdAt, // Conserver la date de création originale
      updatedAt: new Date() // Mettre à jour la date de modification
    });

    const odooId = await createOdooContact(technicien);
    technicien.odooId = odooId;
    await technicien.save();

    res.status(200).json({
      message: 'Utilisateur promu en technicien avec succès',
      technicien
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message,
      // Ajout utile pour débogage:
      details: error.keyValue ? `Conflit sur la clé: ${JSON.stringify(error.keyValue)}` : undefined
    });
  }
};