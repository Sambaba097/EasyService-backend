const Avis = require("../models/Avis");

// Soumettre un avis (Réservé aux clients)
exports.creerAvis = async (req, res) => {
    try {
        const { note, commentaire } = req.body;
        const client = req.user.id; // Récupération automatique de l'ID du client

        // Vérifier que l'utilisateur est bien un client
        if (req.user.role !== "client") {
            return res.status(403).json({ message: "Seuls les clients peuvent soumettre un avis." });
        }

        const nouvelAvis = new Avis({
            note,
            commentaire,
            client
        });

        const avisEnregistre = await nouvelAvis.save();
        res.status(201).json(avisEnregistre);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Récupérer tous les avis
exports.getAllAvis = async (req, res) => {
    try {
        const avis = await Avis.find().populate("client", "nom");
        res.json(avis);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Récupérer un avis par/pour un utilisateur donnée
exports.getAvisById = async (req, res) => {
    try {
        const avis = await Avis.findById(req.params.id).populate("client", "nom");
        if (!avis) return res.status(404).json({ message: "Avis non trouvé" });
        res.json(avis);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
