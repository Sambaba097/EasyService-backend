const mongoose = require('mongoose');
const axios = require('axios');
const NumeroFacture = require('./numeroFacture');
const Service = require('./service');
const User = require('./User'); // Assurez-vous que le modèle User est bien importé

require('dotenv').config();

const SchemaFacture = new mongoose.Schema({
    numeroFacture: {
        type: String,
        unique: true,
        default: function () {
            return 'FAC' + Date.now();
        }
    },
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
        ref: "User",
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

SchemaFacture.pre('save', async function (next) {
    try {
        if (this.isNew) {
            const numero = await NumeroFacture.findOneAndUpdate(
                {},
                { $inc: { dernierNumero: 1 } },
                { new: true, upsert: true }
            );
            this.numeroFacture = `FAC-${String(numero.dernierNumero).padStart(3, '0')}`;
        }

        await this.populate('client technicien admin service');

        // Log des IDs Odoo
        console.log("👉 odooIds :", {
            clientId: this.client.odooId,
            technicienId: this.technicien.odooId,
            adminId: this.admin.odooId,
            serviceId: this.service.odooId
        });

        const clientId = this.client.odooId;
        const technicienId = this.technicien.odooId;
        const adminId = this.admin.odooId;
        const serviceId = this.service.odooId;

        if (!clientId || !technicienId || !adminId || !serviceId) {
            console.warn('⚠️ Un ou plusieurs odooId sont manquants. Facture non envoyée à Odoo.');
            return next(new Error('Un ou plusieurs odooId sont manquants.'));
        }

        // Vérification si les IDs sont valides
        const usersWithOdooId = await User.find({
            odooId: { $in: [clientId, technicienId, adminId] }
        });

        if (usersWithOdooId.length !== 3) {
            console.warn('⚠️ Certains utilisateurs n\'ont pas un odooId valide.');
            return next(new Error('Tous les utilisateurs ne possèdent pas un odooId valide.'));
        }

        const loginResponse = await axios.post(`${process.env.ODOO_URL}/jsonrpc`, {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                service: 'common',
                method: 'login',
                args: [process.env.ODOO_DB, process.env.ODOO_USER, process.env.ODOO_PASS]
            },
            id: 1
        });

        const uid = loginResponse.data.result;

        const odooResponse = await axios.post(`${process.env.ODOO_URL}/jsonrpc`, {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                service: 'object',
                method: 'execute_kw',
                args: [
                    process.env.ODOO_DB,
                    uid,
                    process.env.ODOO_PASS,
                    'account.move',
                    'create',
                    [{
                        move_type: 'out_invoice',
                        partner_id: clientId,
                        invoice_date: this.dateEmission,
                        invoice_user_id: technicienId,
                        user_id: adminId,
                        x_service_id: serviceId,
                        ref: this.numeroFacture
                    }]
                ]
            },
            id: 2
        });

        console.log("🧾 Réponse brute Odoo :", odooResponse.data);
        console.log('✅ Facture créée dans Odoo avec ID :', odooResponse.data.result);
        next();

    } catch (error) {
        console.error('❌ Erreur Odoo lors de la création de facture :', error.response?.data || error.message);
        next(error);
    }
});


module.exports = mongoose.model("Facture", SchemaFacture);


// Exemple de création de facture
const Facture = require('./Facture');
const nouvelleFacture = new Facture({
    montant: 5000,
    service: "67e33e1c01c1370b76fcd839",
    technicien: "67dcc098a6e0285dc7abaed2",
    client: "67d254f2004f9ca4277c94e4",
    admin: "67da88347e9d8aefcaa19120"
});

nouvelleFacture.save()
    .then(() => console.log("Facture enregistrée avec succès"))
    .catch((err) => console.error("Erreur lors de la sauvegarde de la facture :", err));