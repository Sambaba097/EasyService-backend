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
        enum: ["en_attente", "acceptee", "en_cours", "annulee", "refusee", "terminee",],
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
    dates: {
        debutIntervention: Date,
        finIntervention: Date
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
        enum: ["non_commencee", "en_cours", "terminee", "annulee"],
        default: "non_commencee"
    },
    factureGeneree: {
        type: Boolean,
        default: false
    }
});

// Middleware pour déclencher la génération de facture
SchemaDemande.post('findOneAndUpdate', async function(doc) {
    if (doc.etat === 'Terminé' && !doc.facture) {
        const Facture = mongoose.model('Facture');
        const facture = new Facture({
            refDemande: doc._id,
            client: doc.client,
            service: doc.service,
            technicien: doc.technicien,
            admin: doc.admin,
            montant: doc.montant || calculerMontant(doc) // Fonction à implémenter
        });

        await facture.save();
        doc.facture = facture._id;
        await doc.save();

        // Génération du PDF
        await genererFacturePDF(facture);
    }
});

const Demande = mongoose.model("Demande", SchemaDemande);

module.exports = Demande;
