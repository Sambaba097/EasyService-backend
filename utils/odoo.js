const axios = require("axios");

async function createOdooContact(user) {
  const url = `${process.env.ODOO_URL}/jsonrpc`;

  try {
    console.log("👉 Début de l'authentification Odoo...");
    const loginResponse = await axios.post(url, {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "login",
        args: [
          process.env.ODOO_DB,
          process.env.ODOO_USER,
          process.env.ODOO_PASS
        ]
      },
      id: 1
    });
  
    const uid = loginResponse.data.result;
    console.log("✅ Authentification réussie - UID :", uid);
    if (!uid) throw new Error("Erreur d'authentification Odoo");
  
    console.log("👉 Création du contact...");
    const contactResponse = await axios.post(url, {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [
          process.env.ODOO_DB,
          uid,
          process.env.ODOO_PASS,
          "res.partner",
          "create",
          [{
            name: `${user.prenom} ${user.nom}`,
            email: user.email,
          }]
        ]
      },
      id: 2
    });
  
    console.log("✅ Contact Odoo créé avec succès - ID :", contactResponse.data.result);
    return contactResponse.data.result;
  
  } catch (err) {
    console.error("❌ Erreur lors de la création du contact Odoo :", err?.response?.data || err.message);
    throw err;
  }
  
}

async function createOdooProduct(service) {
    const url = `${process.env.ODOO_URL}/jsonrpc`;
  
    // 1. Authentification
    const loginResponse = await axios.post(url, {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "login",
        args: [
          process.env.ODOO_DB,
          process.env.ODOO_USER,
          process.env.ODOO_PASS
        ]
      },
      id: 1
    });
  
    const uid = loginResponse.data.result;
    if (!uid) throw new Error("Erreur d'authentification Odoo");
  
    // 2. Création du produit (product.product)
    const productResponse = await axios.post(url, {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [
          process.env.ODOO_DB,
          uid,
          process.env.ODOO_PASS,
          "product.product",
          "create",
          [{
            name: service.nom,
            list_price: service.tarif,
            type: "service", // Type de produit dans Odoo
            default_code: service._id.toString(), // Référence unique
            description: service.description,
          }]
        ]
      },
      id: 2
    });
  
    return productResponse.data.result; // <- L'ID du produit Odoo
  }
  
module.exports = { createOdooContact,createOdooProduct };


