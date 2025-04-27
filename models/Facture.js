const mongoose = require('mongoose');
const axios = require('axios');
const NumeroFacture = require('./numeroFacture');
const Service = require('./service');
const User = require('./User');
require('dotenv').config();

const SchemaFacture = new mongoose.Schema({
    numeroFacture: {
        type: String,
        unique: true
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
    },
    
});

SchemaFacture.pre('save', async function (next) {
    try {
        if (this.isNew) {
            // Génération du numéro de facture avec l'année
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

        if (!idsOdoo.clientId || !idsOdoo.technicienId || !idsOdoo.adminId) {
            return next(new Error('Un ou plusieurs odooId sont manquants.'));
        }

        // Authentification Odoo
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

        // Création du service dans Odoo si nécessaire
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

        // Récupération des informations du client
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

        const userData = userResponse.data.result?.[0];
        const partnerId = userData?.partner_id?.[0];
        const userName = userData?.name;

        if (!partnerId) {
            throw new Error(`Impossible de récupérer le partner_id pour l'utilisateur ${userName || idsOdoo.clientId}`);
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

        // Création de la facture Odoo
        const factureOdooPayload = {
            move_type: 'out_invoice',
            partner_id: partnerId,
            invoice_date: this.dateEmission,
            x_technicien_id: idsOdoo.technicienId,
            invoice_user_id: idsOdoo.adminId,
            x_service_id: idsOdoo.serviceId,
            ref: this.numeroFacture, // On utilise notre propre numérotation
            invoice_line_ids: [[0, 0, {
                name: `${service.nom} - Client: ${clientName}`,
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
        next();

    } catch (error) {
        console.error('❌ Erreur lors de la création de la facture Odoo :', error.response?.data || error.message);
        next(error);
    }
});

module.exports = mongoose.model("Facture", SchemaFacture);