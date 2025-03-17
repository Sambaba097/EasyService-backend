const Demande = require("../models/Demande");

// Création d'une nouvelle demande
exports.createDemande = async (req, res) => {  // Ajout de 'async' ici
  try {
    const { titre, service } = req.body;
    const client = req.user.id; 

    if (req.user.role !== "client") {
      return res.status(403).json({ message: "La création d'une demande est spécifique à un client" });
    }

    const nouvelleDemande = new Demande({
      titre,
      service,
      client,
      statut: "en_attente"
    });

    const demandeEnregistree = await nouvelleDemande.save();  
    res.status(201).json(demandeEnregistree);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Récupération d'une demande
exports.getDemandeById = async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id);
    if (!demande) return res.status(404).json({ message: "Demande non trouvée" });
    res.json(demande);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupération de toutes les demandes
exports.getAllDemandes = async (req, res) => {
  try {
    const demandes = await Demande.find();
    res.json(demandes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mise à jour d'une demande
exports.updateDemande = async (req, res) => {
  try {
    const demande = await Demande.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!demande) return res.status(404).json({ message: "Demande non trouvée" });

    res.json(demande);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Suppression d'une demande
exports.deleteDemande = async (req, res) => {
  try {
    const demande = await Demande.findByIdAndDelete(req.params.id);
    if (!demande) return res.status(404).json({ message: "Demande non trouvée" });

    res.json({ message: "Demande supprimée avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
