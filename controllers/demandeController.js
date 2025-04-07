const Demande = require("../models/Demande");
const Service = require("../models/service");
// Création d'une nouvelle demande
exports.createDemande = async (req, res) => {
  try {
    const {
      service,       // ID du service
      description,   // Description de la demande
      tarif,         // Tarif côté front
      duree,
      uniteDuree,
      technicien     // Peut être null
    } = req.body;

    const client = req.user.id; // l'utilisateur connecté

    // Vérification du rôle
    if (req.user.role !== "client") {
      return res.status(403).json({ message: "La création d'une demande est réservée aux clients." });
    }

    // Vérification des champs obligatoires
    if (!service || !duree || !uniteDuree || !tarif) {
      return res.status(400).json({ message: "Tous les champs requis doivent être fournis." });
    }

    // Vérification que le service existe
    const serviceExist = await Service.findById(service);
    if (!serviceExist) {
      return res.status(404).json({ message: "Service non trouvé." });
    }

    // Vérification de l'unité
    if (uniteDuree.trim().toLowerCase() !== serviceExist.uniteDuree.trim().toLowerCase()) {
      return res.status(400).json({ message: "L'unité de durée ne correspond pas à celle du service." });
    }
    

    // Création de la demande
    const nouvelleDemande = new Demande({
      service,
      description,
      tarif,
      duree,
      uniteDuree,
      client,
      technicien: technicien || null,
      statut: "en_attente"
    });

    const demandeEnregistree = await nouvelleDemande.save();
    res.status(201).json(demandeEnregistree);

  } catch (err) {
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
