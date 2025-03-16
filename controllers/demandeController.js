const Demande = require("../models/Demande");

// Creation d'une nouvelle demande
exports.creerDemande = async (req, res) => {
    try {
        const { titre, service } = req.body;
        const client = req.user.id; 

        if (req.user.role !== "client") {
            return res.status(403).json({ message: "La creation d'une demande est specifique a un client" });
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

//Reccuperation d'une demande
exports.getDemandeById = async (req, res) => {
    try {
        const demande = await Demande.findById(req.params.id);
        if (!demande) return res.status(404).json({ message: "Demande non trouvée" });
        res.json(demande);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllDemandes = async (req, res) => {
    try {
        const demandes = await Demande.find();
        res.json(demandes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Mis à jour d'une demande
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
