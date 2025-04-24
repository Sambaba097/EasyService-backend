// factureController.js

const Facture = require('../models/Facture');
const mongoose = require('mongoose');

//const User = require('../models/User'); // Pour récupérer les informations des utilisateurs (admin, technicien, client)

/** exports.createFacture = async (req, res) => {
    try {
        const { montant, service, technicien, client } = req.body;
        const adminId = req.user._id;

        const nouvelleFacture = new Facture({
            montant,
            service,
            technicien,
            client,
            admin: adminId
        });

        await nouvelleFacture.save();

        return res.status(201).json({
            message: "Facture créée avec succès",
            facture: nouvelleFacture
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de la création de la facture",
            error: error.message
        });
    }
};
**/

exports.createFacture = async (req, res) => {
    try {
      // Vérification de l'ID client
      if (!mongoose.Types.ObjectId.isValid(req.body.client)) {
        return res.status(400).json({ message: "ID du client invalide." });
      }
  
      // Générer automatiquement le numéro de facture s'il n'est pas fourni
      if (!req.body.numeroFacture) {
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        
        // Compter le nombre de factures déjà créées aujourd'hui
        const count = await Facture.countDocuments({
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        });
  
        const numeroAuto = `FACT-${datePart}-${String(count + 1).padStart(3, '0')}`;
        req.body.numeroFacture = numeroAuto;
      }
  
      const newFacture = new Facture(req.body);
      await newFacture.save();
  
      res.status(201).json({ message: "Facture créée avec succès", facture: newFacture });
    } catch (error) {
      console.error("Erreur lors de la création de la facture :", error);
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };

  
exports.afficherFacture = async (req, res) => {
    try {
        const facture = await Facture.findById(req.params.id)
            .populate('admin', 'nom email')
            .populate('technicien', 'nom')
            .populate('client', 'nom');

        if (!facture) {
            return res.status(404).json({ message: "Facture non trouvée" });
        }

        return res.status(200).json(facture);
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de la récupération de la facture",
            error: error.message
        });
    }
};

exports.afficherToutesLesFactures = async (req, res) => {
    try {
        const factures = await Facture.find()
            .populate('admin', 'nom email')
            .populate('technicien', 'nom')
            .populate('client', 'nom');

        if (factures.length === 0) {
            return res.status(404).json({ message: "Aucune facture trouvée" });
        }

        return res.status(200).json(factures);
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de la récupération des factures",
            error: error.message
        });
    }
};

exports.mettreAJourFacture = async (req, res) => {
    try {
        const factureId = req.params.id;
        const { montant, service, technicien, client } = req.body;

        const factureMiseAJour = await Facture.findByIdAndUpdate(factureId, {
            montant,
            service,
            technicien,
            client
        }, { new: true });

        if (!factureMiseAJour) {
            return res.status(404).json({ message: "Facture non trouvée" });
        }

        return res.status(200).json({
            message: "Facture mise à jour avec succès",
            facture: factureMiseAJour
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de la mise à jour de la facture",
            error: error.message
        });
    }
};

exports.supprimerFacture = async (req, res) => {
    try {
        const factureId = req.params.id;

        const factureSupprimee = await Facture.findByIdAndDelete(factureId);

        if (!factureSupprimee) {
            return res.status(404).json({ message: "Facture non trouvée" });
        }

        return res.status(200).json({ message: "Facture supprimée avec succès" });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de la suppression de la facture",
            error: error.message
        });
    }
};


