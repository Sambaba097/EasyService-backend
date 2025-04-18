const Service = require("../models/service");
const { createOdooProduct } = require("../utils/odoo");
const User = require("../models/User");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} = require("../config/cloudinary");
const mongoose = require('mongoose');

// Créer un service
exports.createService = async (req, res) => {
  try {
    const { nom, description, tarif, duree, uniteDuree, categorie, admin } =
      req.body;

    if (
      !nom || !description || !tarif ||
      !duree || !uniteDuree || !categorie || !admin
    ) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Veuillez télécharger une image valide." });
    }

    const existingService = await Service.findOne({ nom, categorie, tarif });
    if (existingService) {
      return res.status(400).json({ message: "Ce Service existe déjà" });
    }

    const imageUrl = await uploadToCloudinary(req.file.buffer, "Services");

    const service = new Service({
      nom,
      description,
      tarif,
      duree,
      uniteDuree,
      categorie,
      image: imageUrl,
      admin,
    });

    await service.save();

    const odooId = await createOdooProduct(service);
      service.odooId = odooId;
      await service.save();



    res.status(201).json({ message: "Service ajouté avec succès", service });
  } catch (error) {
    console.error("Erreur lors de la création du service :", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la création du service", error });
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
    // Vérifier que l'ID est bien une chaîne valide
    if (!req.params.id || typeof req.params.id !== 'string') {
      return res.status(400).json({ message: "ID de service invalide" });
    }

    // Vérifier le format de l'ID (24 caractères hexadécimaux)
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Format d'ID de service invalide" });
    }

    const service = await Service.findById(req.params.id).populate("categorie");

    if (!service)
      return res.status(404).json({ message: "Service non trouvé" });

    // Solution de secours - Requête manuelle
    let adminDetails = { nom: "Inconnu", prenom: "" };

    if (service.admin) {
      const admin = await User.findById(service.admin).select("nom prenom");
      if (admin) adminDetails = admin;
    }

    const response = {
      ...service.toObject(),
      admin: adminDetails,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la récupération du service",
      error: error.message,
    });
  }
};

//  Mettre à jour un service
exports.updateService = async (req, res) => {

  let newImageUrl = null; // Déclarer en dehors du try pour être accessible dans le catch

  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    // Vérification que l'ID de catégorie est valide
    if (updateData.categorie && !mongoose.Types.ObjectId.isValid(updateData.categorie)) {
      return res.status(400).json({ message: "ID de catégorie invalide" });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Service non trouvé" });
    }

    // Si aucune catégorie n'est fournie, on conserve l'actuelle
    if (!updateData.categorie) {
      updateData.categorie = service.categorie;
    }

    let oldPublicId = null;

    // Si nouvelle image fournie
    if (req.file) {
      // D'abord uploader la nouvelle image
      newImageUrl = await uploadToCloudinary(req.file.buffer, "Services");

      // Ensuite supprimer l'ancienne si elle existe
      if (service.image) {
        oldPublicId = getPublicIdFromUrl(service.image);
        if (oldPublicId) {
          await deleteFromCloudinary(oldPublicId);
        }
      }

      updateData.image = newImageUrl;
    }

    const updatedService = await Service.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.status(200).json(updatedService);
  } catch (err) {
    console.error(err);

    // Si une nouvelle image a été uploadée mais qu'il y a eu une erreur ensuite
    if (newImageUrl) {
      const newPublicId = getPublicIdFromUrl(newImageUrl);
      if (newPublicId) {
        await deleteFromCloudinary(newPublicId).catch(console.error);
      }
    }

    res.status(500).json({
      message: "Erreur lors de la mise à jour du service",
      error: err.message,
    });
  }
};

//  Supprimer un service
exports.deleteService = async (req, res) => {

  const ServiceId = req.params.id;
  try {
    const service = await Service.findById(ServiceId);
    if (!service) {
      return res.status(404).json({ message: "Service non trouvé" });
    }

    // Supprimer l'image de Cloudinary
    const publicId = service.image.split("/").pop().split(".")[0];
    const finalPublicId = `Services/${publicId}`;
    await deleteFromCloudinary(finalPublicId);

    // Supprimer le service de la base de données
    await Service.findByIdAndDelete(ServiceId);

    res.status(200).json({ message: "Service supprimé avec succès" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: error || "Erreur lors de la suppression du service" });
  }
};
