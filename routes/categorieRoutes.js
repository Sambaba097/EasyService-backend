const express = require("express");
const Categorie = require("../models/categorie");
const router = express.Router();

// Créer une nouvelle catégorie
router.post("/", async (req, res) => {
    try {
        const { nom } = req.body;

        // Vérifier si le nom de la catégorie existe déjà
        const existingCategorie = await Categorie.findOne({ nom });
        if (existingCategorie) {
            return res.status(400).json({ message: "La catégorie existe déjà" });
        }

        // Créer une nouvelle catégorie
        const categorie = new Categorie({ nom });
        await categorie.save();
        res.status(201).json(categorie);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la création de la catégorie", error });
    }
});

// Obtenir toutes les catégories
router.get("/", async (req, res) => {
    try {
        const categories = await Categorie.find();
        res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des catégories", error });
    }
});

// Obtenir une catégorie par son ID
router.get("/:id", async (req, res) => {
    try {
        const categorie = await Categorie.findById(req.params.id);
        if (!categorie) {
            return res.status(404).json({ message: "Catégorie non trouvée" });
        }
        res.status(200).json(categorie);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération de la catégorie", error });
    }
});

// Mettre à jour une catégorie par son ID
router.put("/:id", async (req, res) => {
    try {
        const { nom } = req.body;

        // Vérifier si la catégorie existe
        const categorie = await Categorie.findById(req.params.id);
        if (!categorie) {
            return res.status(404).json({ message: "Catégorie non trouvée" });
        }

        // Mettre à jour le nom de la catégorie
        categorie.nom = nom || categorie.nom;
        await categorie.save();
        res.status(200).json(categorie);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la mise à jour de la catégorie", error });
    }
});

// Supprimer une catégorie par son ID
router.delete("/:id", async (req, res) => {
    try {
        const categorie = await Categorie.findByIdAndDelete(req.params.id);
        if (!categorie) {
            return res.status(404).json({ message: "Catégorie non trouvée" });
        }
        res.status(200).json({ message: "Catégorie supprimée avec succès" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la suppression de la catégorie", error });
    }
});

module.exports = router;
