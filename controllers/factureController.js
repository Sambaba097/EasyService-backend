const Facture = require('../models/Facture');
// Génération facture
const creerFacture = async (req, res) => {
  try {
    const { montant } = req.body;
    const nouvelleFacture = new Facture({
      montant
    });
    await nouvelleFacture.save();
    res.status(201).json({ message: 'Facture créée avec succès', facture: nouvelleFacture });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de la facture', error });
  }
};
// Récupération
const recupererFactures = async (req, res) => {
  try {
    const factures = await Facture.find();
    res.status(200).json(factures);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des factures', error });
  }
};

module.exports = {creerFacture,recupererFactures};
