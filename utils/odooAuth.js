// utils/odooAuth.js
const axios = require('axios');
const { ODOO_URL, ODOO_DB, ODOO_USER, ODOO_PASS } = process.env;

let sessionCache = {
    id: null,
    expiry: null
};

async function authenticate() {
    // Vérifie si la session est toujours valide
    if (sessionCache.id && new Date() < sessionCache.expiry) {
        return sessionCache.id;
    }

    try {
        const response = await axios.post(`${ODOO_URL}/web/session/authenticate`, {
            jsonrpc: "2.0",
            params: {
                db: ODOO_DB,
                login: ODOO_USER,
                password: ODOO_PASS
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 5000
        });

        if (!response.data.result?.session_id) {
            throw new Error("Réponse Odoo invalide");
        }

        // Cache la session pour 1 heure
        sessionCache = {
            id: response.data.result.session_id,
            expiry: new Date(Date.now() + 3600000)
        };

        return sessionCache.id;

    } catch (error) {
        console.error("Erreur d'authentification Odoo:", {
            status: error.response?.status,
            data: error.response?.data,
            config: {
                url: error.config?.url,
                method: error.config?.method
            }
        });
        throw new Error("Échec de l'authentification avec Odoo");
    }
}

module.exports = { authenticate };