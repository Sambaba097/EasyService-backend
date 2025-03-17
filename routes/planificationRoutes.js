const express = require("express");
const Planification = require("../models/planification");  // Modèle Planification
const router = express.Router();

// Créer une nouvelle planification
router.post("/", async (req, res) => {
    try {
        const { datePlanifiee, technicienAssigne, demande } = req.body;

        // Vérifier que l'utilisateur est bien un technicien
        const technicien = await User.findOne({ _id: technicienAssigne, role: "technicien" });
        if (!technicien) {
            return res.status(400).json({ message: "L'utilisateur assigné n'est pas un technicien valide." });
        }

        const planification = new Planification({ datePlanifiee, technicienAssigne, demande });
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
        const planifications = await Planification.find()
    .populate({
        path: "technicienAssigne",
        match: { role: "technicien" }, // Vérifier que c'est un technicien
        select: "nom prenom email"
    })
    .populate("demande");

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

        // Vérifier que le technicien est valide
        const technicien = await User.findOne({ _id: technicienAssigne, role: "technicien" });
        if (!technicien) {
            return res.status(400).json({ message: "L'utilisateur assigné n'est pas un technicien valide." });
        }

        const planification = await Planification.findByIdAndUpdate(
            req.params.id,
            { datePlanifiee, technicienAssigne, demande },
            { new: true }
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
