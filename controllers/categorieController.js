const Categorie = require("../models/categorie");

// Créer une nouvelle catégorie
exports.createCategorie = async (req, res) => {
    try {
        const { nom } = req.body;

        // Vérifier si la catégorie existe déjà
        const categorieExistante = await Categorie.findOne({ nom });
        if (categorieExistante) {
            return res.status(400).json({ message: "Cette catégorie existe déjà." });
        }

        const categorie = new Categorie({ nom });
        await categorie.save();
        res.status(201).json(categorie);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la création de la catégorie", error });
    }
};

// Obtenir toutes les catégories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Categorie.find().sort({ dateCreation: -1 }); // Trier par date
        res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des catégories", error });
    }
};

// Obtenir une catégorie par son ID
exports.getCategorieById = async (req, res) => {
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
};

// Mettre à jour une catégorie par son ID
exports.updateCategorie = async (req, res) => {
    try {
        const { nom } = req.body;

        const categorie = await Categorie.findByIdAndUpdate(
            req.params.id,
            { nom },
            { new: true }
        );

        if (!categorie) {
            return res.status(404).json({ message: "Catégorie non trouvée" });
        }

        res.status(200).json(categorie);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la mise à jour de la catégorie", error });
    }
};

// Supprimer une catégorie par son ID
exports.deleteCategorie = async (req, res) => {
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
};