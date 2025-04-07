const mongoose = require('mongoose');
const Technicien = require('../models/Technicien');

exports.createTechnicien = async (req, res) => {
    try {
      const { email, password, prenom, nom, telephone, metier, categorieId } = req.body;
      
      const technicien = new Technicien({
        email,
        password, 
        prenom,
        nom,
        telephone,
        metier,
        categorie: categorieId,
        role: 'technicien' 
      });
  
      await technicien.save();
      res.status(201).json({message: 'Technicien crée avec succés', technicien});
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };