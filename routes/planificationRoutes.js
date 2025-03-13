const express = require("express");
const Planification = require("../models/planification");  // Modèle Planification
const router = express.Router();

// Créer une nouvelle planification
router.post("/", async (req, res) => {
    try {
        const { datePlanifiee, technicienAssigne, demande } = req.body;

        // Créer une nouvelle planification
        const planification = new Planification({
            datePlanifiee,
            technicienAssigne,
            demande,
        });

        // Sauvegarder la planification dans la base de données
        await planification.save();
        res.status(201).json(planification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la création de la planification", error });
    }
});

// Obtenir toutes les planifications
router.get("/", async (req, res) => {
    try {
        const planifications = await Planification.find()
            .populate("technicienAssigne")  // Peupler les informations sur le technicien
            .populate("demande");           // Peupler les informations sur la demande
        res.status(200).json(planifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des planifications", error });
    }
});

// Obtenir une planification par son ID
router.get("/:id", async (req, res) => {
    try {
        const planification = await Planification.findById(req.params.id)
            .populate("technicienAssigne")  // Peupler les informations sur le technicien
            .populate("demande");           // Peupler les informations sur la demande
        if (!planification) {
            return res.status(404).json({ message: "Planification non trouvée" });
        }
        res.status(200).json(planification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération de la planification", error });
    }
});

// Mettre à jour une planification par son ID
router.put("/:id", async (req, res) => {
    try {
        const { datePlanifiee, technicienAssigne, demande } = req.body;

        // Mettre à jour la planification
        const planification = await Planification.findByIdAndUpdate(
            req.params.id,
            {
                datePlanifiee,
                technicienAssigne,
                demande,
            },
            { new: true } // Renvoie la planification mise à jour
        );

        if (!planification) {
            return res.status(404).json({ message: "Planification non trouvée" });
        }

        res.status(200).json(planification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la mise à jour de la planification", error });
    }
});

// Supprimer une planification par son ID
router.delete("/:id", async (req, res) => {
    try {
        const planification = await Planification.findByIdAndDelete(req.params.id);
        if (!planification) {
            return res.status(404).json({ message: "Planification non trouvée" });
        }
        res.status(200).json({ message: "Planification supprimée avec succès" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la suppression de la planification", error });
    }
});

module.exports = router;
