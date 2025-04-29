const mongoose = require('mongoose');
const Technicien = require('../models/Technicien');

exports.createTechnicien = async (req, res) => {
    try {
      const { prenom, nom, telephone, metier, categorie, email, password  } = req.body;
      
      const technicien = new Technicien({
        prenom,
        nom,
        telephone,
        metier,
        categorie: categorie,
        email,
        password, 
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