const Facture = require('../models/Facture');
//const PDFDocument = require("pdfkit");

// Création d'une facture reliee avec un client, technicien et service
const creerFacture = async (req, res) => {
  try {
    const { montant, service, technicien, client } = req.body;

    // Vérification que toutes les infos nécessaires sont présentes
    if (!montant || !service || !technicien || !client) {
      return res.status(400).json({ message: "Tous les champs sont requis (montant, service, technicien, client)" });
    }

    const nouvelleFacture = new Facture({
      montant,
      service,
      technicien,
      client
    });

    await nouvelleFacture.save();
    res.status(201).json({ message: 'Facture créée avec succès', facture: nouvelleFacture });

  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de la facture', error });
  }
};

// Récupération de toutes les factures avec les détails du client, technicien et service
const recupererFactures = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== "admin") {
      query.client = req.user.id; // Si ce n'est pas un admin, l'utiliateur ne voit que ses propres factures
    }

    const factures = await Facture.find(query)
      .populate("client", "nom email")
      .populate("technicien", "nom email")
      .populate("service", "nom");

    res.status(200).json(factures);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des factures", error });
  }
};


// Récupération d'une seule facture par expl : techargement pour le client 
const recupererFactureById = async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id)
      .populate("client", "nom email")
      .populate("technicien", "nom email")
      .populate("service", "nom");

    if (!facture) {
      return res.status(404).json({ message: "Facture non trouvée" });
    }

    res.status(200).json(facture);

  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de la facture', error });
  }
};

module.exports = { creerFacture, recupererFactures, recupererFactureById };
