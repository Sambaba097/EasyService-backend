const mongoose = require("mongoose");

const SchemaDemande = new mongoose.Schema({
    numeroDemande: {
        type: String,
        required: true,
        unique: true
    },
    categorieService: {
        type: String,
        required: true
    },
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
        enum: ["jours", "heures", "minutes"],
        default: "heures" 
    },
    dateIntervention: {
        type: Date,
        required: true
    },
    dateDemande: {
        type: Date,
        default: Date.now
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    technicien: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null // assigné par l’admin plus tard
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

const Demande = mongoose.model("Demande", SchemaDemande);

module.exports = Demande;
