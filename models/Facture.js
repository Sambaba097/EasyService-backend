const mongoose =require('mongoose');

const SchemaFacture = new mongoose.Schema({
    montant: {
        type: Number, 
        required: true 
    },
    dateEmission: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model("Facture", SchemaFacture);