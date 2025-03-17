const mongoose = require('mongoose');

const SchemaFacture = new mongoose.Schema({
    montant: {
        type: Number, 
        required: true 
    },
    dateEmission: { 
        type: Date, 
        default: Date.now 
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
    },
    technicien: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Utilisateur",
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Utilisateur",
        required: true
    }
});

module.exports = mongoose.model("Facture", SchemaFacture);