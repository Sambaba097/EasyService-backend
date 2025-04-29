const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Importe ton modèle de Service
const Service = require('../models/service'); // adapte le chemin

async function syncServicesToOdoo() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté à MongoDB');

        const services = await Service.find({});
        console.log(`🔎 ${services.length} services trouvés.`);

        // Connecte-toi à Odoo
        const loginResponse = await axios.post(`${process.env.ODOO_URL}/jsonrpc`, {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                service: 'common',
                method: 'login',
                args: [process.env.ODOO_DB, process.env.ODOO_USER, process.env.ODOO_PASS],
            },
            id: 1
        });

        const uid = loginResponse.data.result;
        console.log(`🔑 Connecté à Odoo avec UID ${uid}`);

        for (const service of services) {
            let needCreate = false;

            if (service.odooId) {
                // Vérifie si l'odooId existe
                const check = await axios.post(`${process.env.ODOO_URL}/jsonrpc`, {
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
                            'search_read',
                            [[['id', '=', service.odooId]], ['id']]
                        ]
                    },
                    id: 2
                });

                if (!check.data.result.length) {
                    console.log(`⚠️ Service ${service.nom} (odooId ${service.odooId}) inexistant dans Odoo.`);
                    needCreate = true;
                } else {
                    console.log(`✅ Service ${service.nom} existe déjà sur Odoo.`);
                }
            } else {
                console.log(`ℹ️ Service ${service.nom} sans odooId.`);
                needCreate = true;
            }

            if (needCreate) {
                // Crée le service dans Odoo
                const createResponse = await axios.post(`${process.env.ODOO_URL}/jsonrpc`, {
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
                            [{
                                name: service.nom,
                                list_price: service.price,
                                type: 'service',
                            }]
                        ]
                    },
                    id: 3
                });

                const newOdooId = createResponse.data.result;
                service.odooId = newOdooId;
                await service.save();
                console.log(`🎯 Service ${service.nom} créé sur Odoo avec ID ${newOdooId}.`);
            }
        }

        console.log('✅ Synchronisation terminée.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur pendant la synchronisation :', error.response?.data || error.message);
        process.exit(1);
    }
}

syncServicesToOdoo();
