const mongoose = require('mongoose');

const SchemaNumeroFacture = new mongoose.Schema({
    annee: { type: Number, required: true, unique: true },
    dernierNumero: {
        type: Number,
        default: 0 // Le premier numéro de facture sera "FAC-001"
    }
});

module.exports = mongoose.model("NumeroFacture", SchemaNumeroFacture);
