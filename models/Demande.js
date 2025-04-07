const mongoose = require("mongoose");
const Service = require("./service"); // important pour calcul

const SchemaDemande = new mongoose.Schema({
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
    },
    description: {
        type: String 
    },
    tarif: {
        type: Number 
    },
    statut: {
        type: String,
        enum: ["en_attente", "validée", "rejetée"],
        default: "en_attente"
    },
    duree: { 
        type: Number, 
        required: true 
    },
    uniteDuree: { 
        type: String, 
        required: true, 
        enum: ["jours", "heures", "minutes"] 
    },
    dateDemande: {
        type: Date,
        default: Date.now
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Utilisateur",
        required: true
    },
    technicien: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Utilisateur",
        default: null
    },
    etatExecution: {
        type: String,
        enum: ["non_commencée", "en_cours", "terminée"],
        default: "non_commencée"
    },
    factureGeneree: {
        type: Boolean,
        default: false
    }
});
module.exports = mongoose.model("Demande", SchemaDemande);
