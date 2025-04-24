const mongoose = require('mongoose');
const axios = require('axios');
const NumeroFacture = require('./numeroFacture');
const Service = require('./service');
const User = require('./User');
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
    },
    odooInvoiceId: {
        type: Number
    },
    refDemande: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Demande",
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
        const { client, technicien, admin, service } = this;

        const idsOdoo = {
            clientId: client.odooId,
            technicienId: technicien.odooId,
            adminId: admin.odooId,
            serviceId: service.odooId
        };

        console.log("👉 odooIds :", idsOdoo);

        if (!idsOdoo.clientId || !idsOdoo.technicienId || !idsOdoo.adminId) {
            return next(new Error('Un ou plusieurs odooId sont manquants.'));
        }

        // Connexion à Odoo
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
        if (!uid) throw new Error("Échec de l'authentification avec Odoo.");
        console.log("🔐 Authentifié sur Odoo avec l'UID :", uid);

        // Créer le service dans Odoo si pas encore créé
        if (!service.odooId) {
            const produitPayload = {
                name: service.nom || "Service Auto",
                type: "service",
            };

            const createServiceResponse = await axios.post(`${process.env.ODOO_URL}/jsonrpc`, {
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    service: 'object',
                    method: 'execute_kw',
                    args: [
                        process.env.ODOO_DB,
                        uid,
                        process.env.ODOO_PASS,
                        'product.product',
                        'create',
                        [produitPayload]
                    ]
                },
                id: 1
            });

            const newServiceOdooId = createServiceResponse.data.result;
            console.log("🛠️ Service créé dans Odoo avec ID :", newServiceOdooId);

            // Mettre à jour le service local avec l'odooId
            service.odooId = newServiceOdooId;
            await service.save();

            idsOdoo.serviceId = newServiceOdooId;
        }

        // Création de la facture dans Odoo
        const factureOdooPayload = {
            move_type: 'out_invoice',
            partner_id: idsOdoo.clientId,
            invoice_date: this.dateEmission,
            x_technicien_id: idsOdoo.technicienId,
            invoice_user_id: idsOdoo.adminId,
            x_service_id: idsOdoo.serviceId,
            ref: this.numeroFacture,
            invoice_line_ids: [
                [0, 0, {
                    name: service.nom || "Service",
                    quantity: 1,
                    price_unit: this.montant,
                    account_id: 701100 // À adapter dynamiquement si besoin
                }]
            ]
        };

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
                    [factureOdooPayload]
                ]
            },
            id: 1
        });
        console.log("🧾 Réponse Odoo facture :", odooResponse.data);

        this.odooInvoiceId = odooResponse.data.result;
        console.log('✅ Facture créée dans Odoo avec ID :', this.odooInvoiceId);
        next();

    } catch (error) {
        console.error('❌ Erreur lors de la création de la facture Odoo :', error.response?.data || error.message);
        next(error);
    }
});

module.exports = mongoose.model("Facture", SchemaFacture);


/**const Facture = require('./Facture');

const nouvelleFacture = new Facture({
    montant: 5000,
    service: "67e33e1c01c1370b76fcd839",
    technicien: "67dcc098a6e0285dc7abaed2",
    client: "67fe4179b335d44e295b9851",
    admin: "67da88347e9d8aefcaa19120",
    refDemande: "65f3abc1234567890abcdef1"
    

});

nouvelleFacture.save()
    .then(() => console.log("📄 Facture enregistrée avec succès"))
    .catch((err) => console.error("💥 Erreur lors de l'enregistrement :", err.message));

**/