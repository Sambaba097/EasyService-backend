const Planification = require("../models/planification");

// Créer une planification
exports.creerPlanification = async (req, res) => {
    try {
        const { datePlanifiee, technicienAssigne, demande } = req.body;
        const nouvellePlanification = new Planification({ datePlanifiee, technicienAssigne, demande });
        await nouvellePlanification.save();
        res.status(201).json(nouvellePlanification);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la création de la planification", error });
    }
};

// Récupérer toutes les planifications avec uniquement les techniciens
exports.getPlanifications = async (req, res) => {
    try {
        const planifications = await Planification.find()
            .populate({
                path: "technicienAssigne",
                match: { role: "technicien" },
                select: "nom prenom email"
            })
            .populate("demande");

        res.status(200).json(planifications);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des planifications", error });
    }
};
