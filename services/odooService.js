// services/odooService.js

const xmlrpc = require('xmlrpc');
require('dotenv').config();

// Config Odoo
const url = 'https://easyserviceodoo.odoo.com'; // Ton Odoo Online
const db = process.env.ODOO_DB;
const username = process.env.ODOO_USER;
const password = process.env.ODOO_PASS;

// Clients XML-RPC
const common = xmlrpc.createSecureClient({ url: `${url}/xmlrpc/2/common` });
const object = xmlrpc.createSecureClient({ url: `${url}/xmlrpc/2/object` });

// Fonction pour s'authentifier
async function authenticate() {
    return new Promise((resolve, reject) => {
        common.methodCall('authenticate', [db, username, password, {}], (err, uid) => {
            if (err || !uid) {
                reject(new Error('Échec de l\'authentification à Odoo'));
            } else {
                resolve(uid);
            }
        });
    });
}

// Fonction pour récupérer une facture par ID
async function getFactureById(factureId) {
    try {
        const uid = await authenticate();

        return new Promise((resolve, reject) => {
            object.methodCall('execute_kw', [
                db,
                uid,
                password,
                'account.move',       // Le modèle Odoo pour les factures
                'search_read',
                [[['id', '=', factureId]]], // Critère de recherche
                { fields: ['id', 'name', 'amount_total', 'state'] } // Champs que tu veux récupérer
            ], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result[0]); // résultat = tableau
                }
            });
        });

    } catch (error) {
        console.error('Erreur getFactureById:', error.message);
        throw error;
    }
}

module.exports = { authenticate, getFactureById };
