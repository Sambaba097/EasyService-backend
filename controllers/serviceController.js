const Service = require("../models/service");

// Créer un service
exports.createService = async (req, res) => {
    try {
        const { nom, description, tarif, duree, uniteDuree, categorie, image } = req.body;
        const service = new Service({ nom, description, tarif, duree, uniteDuree, categorie, image });
        await service.save();
        res.status(201).json(service);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la création du service", error });
    }
};

// Obtenir tous les services
exports.getAllServices = async (req, res) => {
    try {
        const services = await Service.find().populate("categorie");
        res.status(200).json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des services", error });
    }
};

//  Obtenir un service par son ID
exports.getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id).populate("categorie");
        if (!service) return res.status(404).json({ message: "Service non trouvé" });
        res.status(200).json(service);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération du service", error });
    }
};

//  Mettre à jour un service
exports.updateService = async (req, res) => {
    try {
        const { nom, description, tarif, duree, uniteDuree, categorie, image } = req.body;
        const service = await Service.findByIdAndUpdate(
            req.params.id,
            { nom, description, tarif, duree, uniteDuree, categorie, image },
            { new: true }
        );
        if (!service) return res.status(404).json({ message: "Service non trouvé" });
        res.status(200).json(service);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la mise à jour du service", error });
    }
};

//  Supprimer un service
exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) return res.status(404).json({ message: "Service non trouvé" });
        res.status(200).json({ message: "Service supprimé avec succès" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la suppression du service", error });
    }
};