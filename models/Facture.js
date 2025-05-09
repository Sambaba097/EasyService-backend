const mongoose = require('mongoose');
const axios = require('axios');
const NumeroFacture = require('./numeroFacture');
const Service = require('./service');
const User = require('./User');
require('dotenv').config();

const SchemaFacture = new mongoose.Schema({
    numeroFacture: { type: String, unique: true },
    montant: { type: Number, required: true },
    dateEmission: { type: Date, default: Date.now },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    technicien: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    odooInvoiceId: { type: Number },
    refDemande: { type: mongoose.Schema.Types.ObjectId, ref: "Demande", required: true },
});

// Fonction pour se connecter à Odoo

// async function loginOdoo() {
//     try {
//         const response = await axios.post(`${process.env.ODOO_URL}/jsonrpc`, {
//             jsonrpc: '2.0',
//             method: 'call',
//             params: {
//                 service: 'common',
//                 method: 'login',
//                 args: [process.env.ODOO_DB, process.env.ODOO_USER, process.env.ODOO_PASS]
//             },
//             id: 1
//         });

//         const uid = response.data.result;
//         if (!uid) {
//             console.error("❌ Réponse Odoo:", JSON.stringify(response.data, null, 2));
//             throw new Error("Échec de l'authentification avec Odoo.");
//         }

//         return uid;

//     } catch (err) {
//         console.error("💥 Erreur lors de la connexion à Odoo :", err.response?.data || err.message);
//         throw err;
//     }
// }

async function loginOdoo() {
    const response = await axios.post(`${process.env.ODOO_URL}/jsonrpc`, {
        jsonrpc: '2.0',
        method: 'call',
        params: {
            service: 'common',
            method: 'login',
            args: [process.env.ODOO_DB, process.env.ODOO_USER, process.env.ODOO_PASS]
        },
        id: 1
    });
    const uid = response.data.result;
    if (!uid) throw new Error("Échec de l'authentification avec Odoo.");
    return uid;
}

SchemaFacture.pre('save', async function (next) {
    try {
        if (this.isNew) {
            const anneeFacture = new Date(this.dateEmission).getFullYear();
            const numero = await NumeroFacture.findOneAndUpdate(
                { annee: anneeFacture },
                { $inc: { dernierNumero: 1 } },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            this.numeroFacture = `FAC-${anneeFacture}-${String(numero.dernierNumero).padStart(4, '0')}`;
            console.log(`🔢 Numéro de facture généré: ${this.numeroFacture}`);
        }

        await this.populate(['client', 'technicien', 'admin', 'service']);
        const { client, technicien, admin, service } = this;

        const idsOdoo = {
            clientId: client?.odooId,
            technicienId: technicien?.odooId,
            adminId: admin?.odooId,
            serviceId: service?.odooId
        };

        console.log(idsOdoo);

        if (!idsOdoo.clientId || !idsOdoo.technicienId || !idsOdoo.adminId) {
            return next(new Error('Un ou plusieurs odooId sont manquants.'));
        }

        const uid = await loginOdoo();

        // Création du service dans Odoo si besoin
        if (!service.odooId) {
            const produitPayload = {
                name: service.nom || "Service Auto",
                type: "service"
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
                id: 2
            });
            const newServiceOdooId = createServiceResponse.data.result;
            service.odooId = newServiceOdooId;
            await service.save();
            idsOdoo.serviceId = newServiceOdooId;
        }

        // Lecture des infos client
        const userResponse = await axios.post(`${process.env.ODOO_URL}/jsonrpc`, {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                service: 'object',
                method: 'execute_kw',
                args: [
                    process.env.ODOO_DB,
                    uid,
                    process.env.ODOO_PASS,
                    'res.users',
                    'read',
                    [[idsOdoo.clientId], ['partner_id', 'name']]
                ]
            },
            id: 4
        });

        let userData = userResponse.data.result?.[0];
        let partnerId = userData?.partner_id?.[0];

        if (!partnerId) {
            // Création d'un partenaire si absent
            const createPartnerResponse = await axios.post(`${process.env.ODOO_URL}/jsonrpc`, {
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    service: 'object',
                    method: 'execute_kw',
                    args: [
                        process.env.ODOO_DB,
                        uid,
                        process.env.ODOO_PASS,
                        'res.partner',
                        'create',
                        [{

                            name: client.prenom + ' ' + client.nom,
                            email: client.email,
                            phone: client.telephone,
                        }]
                    ]
                },
                id: 7
            });
            partnerId = createPartnerResponse.data.result;
            console.log(`🆕 Nouveau partner_id créé: ${partnerId}`);
        }

        // Vérification du partenaire
        const partnerResponse = await axios.post(`${process.env.ODOO_URL}/jsonrpc`, {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                service: 'object',
                method: 'execute_kw',
                args: [
                    process.env.ODOO_DB,
                    uid,
                    process.env.ODOO_PASS,
                    'res.partner',
                    'read',
                    [[partnerId], ['name', 'email', 'phone']]
                ]
            },
            id: 5
        });

        const partnerData = partnerResponse.data.result?.[0];
        const clientName = partnerData?.name;

        if (!clientName || clientName.includes('Template')) {
            throw new Error(`Le nom du client "${clientName}" est invalide. Veuillez corriger dans Odoo.`);
        }

        console.log(`👤 Client trouvé: ${clientName}`);

        // Création de la facture dans Odoo
        const factureOdooPayload = {
            move_type: 'out_invoice',
            partner_id: partnerId,
            invoice_date: this.dateEmission,
            x_technicien_id: idsOdoo.technicienId,
            // invoice_user_id: idsOdoo.adminId,
            x_service_id: idsOdoo.serviceId,
            ref: this.numeroFacture,
            invoice_line_ids: [[0, 0, {
              //  name: `${service.nom} - Client: ${clientName}`,
                name: service.nom,

                quantity: 1,
                price_unit: this.montant,
                account_id: service.account_id || 973,
                product_id: idsOdoo.serviceId
            }]]
        };

        console.log("📦 Données envoyées à Odoo :", JSON.stringify(factureOdooPayload, null, 2));

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
            id: 6
        });

        console.log("✅ Réponse d'Odoo :", JSON.stringify(odooResponse.data, null, 2));

        if (!odooResponse.data.result) {
            throw new Error("❌ Aucun ID de facture reçu depuis Odoo.");
        }

        this.odooInvoiceId = odooResponse.data.result;
        // Appel de la méthode action_post pour valider la facture
await axios.post(`${process.env.ODOO_URL}/jsonrpc`, {
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
            'action_post',
            [[this.odooInvoiceId]]  // Note le double tableau
        ]
    },
    id: 7
});

console.log("✅ Facture validée automatiquement dans Odoo.");
// Enregistrer le paiement automatiquement
// 1. Créer le paiement

const paiementResponse = await axios.post(`${process.env.ODOO_URL}/jsonrpc`, {
    jsonrpc: '2.0',
    method: 'call',
    params: {
        service: 'object',
        method: 'execute_kw',
        args: [
            process.env.ODOO_DB,
            uid,
            process.env.ODOO_PASS,
            'account.payment',
            'create',
            [{
                partner_type: 'customer',
                payment_type: 'inbound',
                partner_id: partnerId,
                amount: this.montant,
                journal_id: 12,
                payment_method_id: 1,
                //payment_date: this.dateEmission,
                invoice_ids: [[6, false, [this.odooInvoiceId]]],
            }]
        ]
    },
    id: 8
});

if (!paiementResponse.data.result) {
    console.error("❌ Erreur lors de la création du paiement :", paiementResponse.data.error);
    throw new Error("La création du paiement a échoué.");
}

const paymentId = paiementResponse.data.result;
console.log("💰 Paiement créé dans Odoo avec l'ID :", paymentId);


// 2. Poster (valider) le paiement
await axios.post(`${process.env.ODOO_URL}/jsonrpc`, {
    jsonrpc: '2.0',
    method: 'call',
    params: {
        service: 'object',
        method: 'execute_kw',
        args: [
            process.env.ODOO_DB,
            uid,
            process.env.ODOO_PASS,
            'account.payment',
            'action_post',
            [[paymentId]]
        ]
    },
    id: 9
});

console.log("✅ Paiement validé dans Odoo.");




        next();

    } catch (error) {
        console.error('❌ Erreur lors de la création de la facture Odoo :', error.response?.data || error.message);
        next(error);
    }
});

module.exports = mongoose.model("Facture", SchemaFacture);
