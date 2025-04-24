const Demande = require("../models/Demande");
const Service = require("../models/service");
const User = require('../models/User');
const Compteur = require("../models/Compteur"); 

// Création d'une nouvelle demande
exports.createDemande = async (req, res) => {
  try {
    const {
      service,       // ID du service
      description,   // Description de la demande
      tarif,         // Tarif côté front
      duree,
      uniteDuree,
      technicien,    // Peut être null
      dateIntervention
    } = req.body;

    const client = req.user.id;

    // Vérification du rôle
    if (req.user.role !== "client") {
      return res.status(403).json({ message: "La création d'une demande est réservée aux clients." });
    }

    // Vérification des champs obligatoires
    if (!service || !duree || !uniteDuree || !tarif) {
      return res.status(400).json({ message: "Tous les champs requis doivent être fournis." });
    }

    // Vérification du service
    const serviceExist = await Service.findById(service);
    if (!serviceExist) {
      return res.status(404).json({ message: "Service non trouvé." });
    }

    // Vérification de l’unité de durée
    if (uniteDuree.trim().toLowerCase() !== serviceExist.uniteDuree.trim().toLowerCase()) {
      return res.status(400).json({ message: "L'unité de durée ne correspond pas à celle du service." });
    }

    // 🔢 Générer le numéro auto-incrémenté
    const compteur = await Compteur.findOneAndUpdate(
      { nom: "demande" },
      { $inc: { valeur: 1 } },
      { new: true, upsert: true }
    );

    const numeroAuto = `DMD-${String(compteur.valeur).padStart(4, "0")}`; // exemple : DMD-0001

    // ✅ Création de la demande
    const nouvelleDemande = new Demande({
      numeroDemande: numeroAuto,
      service,
      categorieService: serviceExist.categorie,
      description: description || serviceExist.description,
      tarif,
      duree,
      uniteDuree: serviceExist.uniteDuree,
      client,
      technicien: technicien || null,
      statut: "en_attente",
      dateIntervention
    });

    const demandeEnregistree = await nouvelleDemande.save();
    res.status(201).json(demandeEnregistree);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Récupération d'une demande par son ID
exports.getDemandeById = async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id).populate("service client technicien");
    if (!demande) {
      return res.status(404).json({ message: "Demande non trouvée." });
    }
    res.json(demande);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupération de toutes les demandes
exports.getAllDemandes = async (req, res) => {
  try {
    const demandes = await Demande.find().populate("service client technicien");
    res.json(demandes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mise à jour d'une demande
exports.updateDemande = async (req, res) => {
  try {
    const demande = await Demande.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!demande) {
      return res.status(404).json({ message: "Demande non trouvée." });
    }
    res.json(demande);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Suppression d'une demande
exports.deleteDemande = async (req, res) => {
  try {
    const demande = await Demande.findByIdAndDelete(req.params.id);
    if (!demande) {
      return res.status(404).json({ message: "Demande non trouvée." });
    }
    res.json({ message: "Demande supprimée avec succès." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Pour les clients
exports.getDemandesByClient = async (req, res) => {
  try {
    const demandes = await Demande.find({ client: req.params.clientId })
      .populate("service client technicien");
    res.json(demandes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Pour les techniciens
exports.getDemandesByTechnicien = async (req, res) => {
  try {
    const demandes = await Demande.find({ technicien: req.params.technicienId })
      .populate("service client technicien");
    res.json(demandes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// controllers/demandeController.js



// Assigner une demande à un technicien
exports.assignerDemande = async (req, res) => {
  const { demandeId, technicienId } = req.body;

  try {
    // Vérifier que le technicien est disponible
    const technicien = await User.findById(req.body.technicienId);
    if (!technicien || technicien.role !== 'technicien') {
      return res.status(404).json({ message: "Technicien introuvable." });
    }

    if (!technicien.disponible) {
      return res.status(400).json({ message: "Ce technicien n'est pas disponible." });
    }
    const demandeExistante = await Demande.findOne({ technicien: technicienId, statut: { $ne: "terminee" } });
    if (demandeExistante) {
      return res.status(400).json({ message: "Ce technicien a déjà une demande en cours." });
    }

    // Mettre à jour la demande
    const demande = await Demande.findById(demandeId);
    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable." });
    }

    demande.technicien = technicienId;
    demande.statut = 'acceptee'; // Mettre à jour le statut de la demande
    demande.etatExecution = 'non_commencee'; // Mettre à jour l'état d'exécution
    await demande.save();

   
    // Mettre à jour la dispo du technicien
    technicien.disponible = false;
    await technicien.save();

    res.status(200).json({ message: "Demande assignée avec succès.", demande });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de l'assignation.", error: err.message });
  }
};

// Commencer une demande
exports.commencerDemande = async (req, res) => {
  try {
    const { demandeId } = req.params;
    const { dateDebut } = req.body; // Récupération de la date depuis le corps

    // Vérification des données
    if (!dateDebut) {
      return res.status(400).json({ message: "La date de début est requise." });
    }

    const demande = await Demande.findById(demandeId);
    
    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable." });
    }

    // Initialisation de l'objet dates si inexistant
    if (!demande.dates) {
      demande.dates = {};
    }

    // Mise à jour des dates
    demande.etatExecution = "en_cours";
    demande.statut = "en_cours";
    demande.dates.debutIntervention = new Date(dateDebut);
    
    await demande.save();

    res.status(200).json({ 
      message: "Tâche marquée comme commencée.",
      demande: {
        id: demande._id,
        statut: demande.statut,
        dateDebut: demande.dates.debutIntervention
      }
    });

  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Marquer une demande comme terminée
exports.terminerDemande = async (req, res) => {
  const { demandeId } = req.params;

  try {
    const demande = await Demande.findById(demandeId);
    
    if (!demande) {
      return res.status(404).json({ message: "Demande non trouvée." });
    }

    if (demande.etatExecution !== "en_cours") {
      return res.status(400).json({ 
        message: "La tâche doit être en cours pour être terminée." 
      });
    }

    // Mettre à jour les états
    demande.etatExecution = "terminee";
    demande.statut = "terminee";
    demande.dates.finIntervention = new Date();

    await demande.save();

    // Libérer le technicien
    const technicien = await User.findById(demande.technicien);
    if (technicien) {
      technicien.disponible = true;
      await technicien.save();
    }

    res.status(200).json({ message: "Demande terminée avec succès.", demande });

  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la finalisation.", error: err.message });
  }
};
