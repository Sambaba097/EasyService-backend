// factureController.js

const Facture = require('../models/Facture');
const mongoose = require('mongoose');
const ODOO_URL = process.env.ODOO_URL; // (si tu as un .env avec la variable)

//const User = require('../models/User'); // Pour récupérer les informations des utilisateurs (admin, technicien, client)

/** exports.createFacture = async (req, res) => {
    try {
        const { montant, service, technicien, client } = req.body;
        const adminId = req.user._id;

        const nouvelleFacture = new Facture({
            montant,
            service,
            technicien,
            client,
            admin: adminId
        });

        await nouvelleFacture.save();

        return res.status(201).json({
            message: "Facture créée avec succès",
            facture: nouvelleFacture
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de la création de la facture",
            error: error.message
        });
    }
};
**/
const odooService = require('../services/odooService'); // Service d'authentification Odoo

const axios = require('axios');
const fs = require('fs'); // optionnel si tu veux enregistrer localement


exports.downloadFacture = async (req, res) => {
    const id = req.params.id;
    const odooUrl = process.env.ODOO_URL;
    const odooUsername = process.env.ODOO_USER;
    const odooPassword = process.env.ODOO_PASS;

    try {
        // Créer un axios instance pour gérer les cookies
        const axiosInstance = axios.create({
            baseURL: odooUrl,
            withCredentials: true
        });

        // Authentification à Odoo
        const authResponse = await axiosInstance.post('/web/session/authenticate', {
            params: {
                db: process.env.ODOO_DB,
                login: odooUsername,
                password: odooPassword
            }
        });

        const sessionId = authResponse.headers['set-cookie']?.find(cookie => cookie.startsWith('session_id'));
        if (!sessionId) {
            throw new Error('Impossible de récupérer le cookie de session.');
        }
        console.log('✅ Session Odoo récupérée');

        // Maintenant appel du PDF
        const pdfUrl = `/report/pdf/account.report_invoice/${id}`;

        const pdfResponse = await axiosInstance.get(pdfUrl, {
            responseType: 'arraybuffer',
            headers: {
                'Cookie': sessionId,
                'Content-Type': 'application/pdf'
            },
            timeout: 30000 // 30 secondes
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=facture.pdf');
       // res.setHeader('Content-Disposition', `attachment; filename=facture_${facture.odooInvoiceId}.pdf`);

        res.send(pdfResponse.data);

        console.log('✅ Facture PDF téléchargée avec succès.');

    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
        res.status(500).send('Erreur lors de la génération de la facture');
    }
};


//     try {
//         // Construire l'URL directe vers le PDF
//         const pdfUrl = `${odooUrl}report/pdf/account.report_invoice/${id}`;
//         console.log('🔗 URL PDF:', pdfUrl);

//         // Appel GET avec authentification Basic
//         const response = await axios.get(pdfUrl, {
//             responseType: 'arraybuffer', // important pour récupérer un fichier binaire
//             auth: {
//                 username: odooUsername,
//                 password: odooPassword
//             }
//         });

//         // Envoyer le PDF au client
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', 'attachment; filename=facture.pdf');
//         res.send(response.data);

//         console.log('✅ Facture PDF envoyée avec succès');
        
//     } catch (error) {
//         console.error('❌ Erreur lors du téléchargement du PDF:', error.response?.data || error.message);
//         res.status(500).send('Erreur lors du téléchargement du PDF');
//     }
// };


//     const odooUsername = process.env.ODOO_USER;
//     const odooPassword = process.env.ODOO_PASS;

//     try {
//         const pdfResponse = await axios.get(`${odooUrl}/report/pdf/account.report_invoice/${id}`, {
//             responseType: 'arraybuffer',
//             auth: {
//                 username: odooUsername,
//                 password: odooPassword
//             }
//         });

//         console.log('✅ PDF facture récupéré');

//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', 'attachment; filename="facture.pdf"');
//         res.send(pdfResponse.data);

//     } catch (error) {
//         console.error('❌ Erreur lors du téléchargement du PDF:', error.response?.data || error.message);
//         res.status(500).send('Erreur lors du téléchargement du PDF');
//     }
// };


//     const id = req.params.id; // récupère ID dans URL
//     const odooUrl = process.env.ODOO_URL;
//     const odooDb = process.env.ODOO_DB;
//     const odooUsername = process.env.ODOO_USER;
//     const odooPassword = process.env.ODOO_PASS;

//     try {
//         // Authentification Odoo
//         const authResponse = await axios.post(`${odooUrl}/jsonrpc`, {
//             jsonrpc: "2.0",
//             method: "call",
//             params: {
//                 service: "common",
//                 method: "authenticate",
//                 args: [odooDb, odooUsername, odooPassword, {}]
//             },
//             id: 1
//         });

//         const uid = authResponse.data.result;
//         if (!uid) {
//             throw new Error('Échec de l\'authentification à Odoo');
//         }
//         console.log('✅ Authentifié à Odoo avec UID :', uid);

//         // Récupération du PDF
//         const reportResponse = await axios.post(`${odooUrl}/jsonrpc`, {
//             jsonrpc: "2.0",
//             method: "call",
//             params: {
//                 service: "report",
//                 method: "render_report",
//                 args: [
//                     odooDb, uid, odooPassword,
//                     "account.report_invoice",   // Peut-être à corriger ici
//                     [parseInt(id)] // ✅ ici !
//                 ]
//             },
//             id: 2
//         }, {
//             responseType: 'arraybuffer',
//             headers: {
//               'Content-Type': 'application/json'
//              }
//         });
//         console.log('📄 Demande de génération de PDF pour la facture ID:', id);

//         const pdfData = reportResponse.data.result; // 📌 Ici on récupère le base64 du PDF
//         if (!pdfData) {
//             throw new Error('PDF non généré');
//         }

//         // Envoi du PDF
//         const fileBuffer = Buffer.from(pdfData, 'base64');

//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', 'attachment; filename=facture.pdf');
//         res.send(fileBuffer);

//         console.log('✅ Facture PDF envoyée avec succès');

//     } catch (error) {
//         console.error('❌ Erreur lors de la génération de la facture:', error.response?.data || error.message);
//         res.status(500).send('Erreur lors de la génération de la facture');
//     }
// };



// exports.downloadFacture = async (req, res) => {
//     try {
//         const { id } = req.params;
//         console.log("ID Odoo reçu :", id);

//         const facture = await Facture.findOne({ odooInvoiceId: id });

//         if (!facture) {
//             return res.status(404).json({ message: "Facture non trouvée dans MongoDB" });
//         }

//         const response = await axios({
//             method: 'GET',
//             url: `${process.env.ODOO_URL}/report/pdf/account.report_invoice/${facture.odooInvoiceId}`,
//             auth: {
//               username: 'nfatmata614@gmail.com',
//               password: 'bbmarie2025@'
//             },
//             responseType: 'arraybuffer',
//         });
//         console.log("Type de réponse:", response.headers['content-type']);
//         console.log("Longueur du fichier:", response.data.length);
//         console.log("Premier bout du fichier:", response.data.toString('utf8').slice(0, 200)); // Affiche les 200 premiers caractères du PDF (pour vérifier le contenu)

//         console.log("Réponse Odoo reçue (PDF)");          

//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', `attachment; filename=facture_${facture.odooInvoiceId}.pdf`);
//         res.send(response.data);

//     } catch (error) {
//         console.error("Erreur complète:", {
//             odooId: null,
//             error: error.message,
//             stack: error.stack,
//             contenu: error.response?.data?.toString()
//         });

//         const statusCode = error.response?.status || 500;
//         res.status(statusCode).json({
//             error: "Impossible de télécharger la facture",
//             details: statusCode === 500 ? "Erreur serveur" : error.message
//         });
//     }
// };



// exports.downloadFacture = async (req, res) => {
//     try {
//         const { id } = req.params;
//         console.log("ID Odoo reçu :", id);

//         const facture = await Facture.findOne({ odooInvoiceId: id });

//         if (!facture) {
//             return res.status(404).json({ message: "Facture non trouvée dans MongoDB" });
//         }

//         const response = await axios({
//             method: 'GET',
//             url: `${process.env.ODOO_URL}/report/pdf/account.report_invoice/${facture.odooInvoiceId}`,
//             auth: {
//                 username: 'ton.email@example.com',  // ton login Odoo
//                 password: 'ton_motdepasse'           // ton mot de passe Odoo
//               },
//               responseType: 'arraybuffer', 
//            // responseType: 'arraybuffer', // 🔵 pour recevoir le fichier PDF
//         });
//         console.log("Réponse Odoo reçue :", response.data);

//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', `attachment; filename=facture_${facture.name}.pdf`);
//         res.send(response.data);

//     } catch (error) {
//         console.error("Erreur complète:", {
//             odooId: null,
//             error: error.message,
//             stack: error.stack
//             contenu: error.response?.data?.toString()

//         });

//         const statusCode = error.response?.status || 500;
//         res.status(statusCode).json({
//             error: "Impossible de télécharger la facture",
//             details: statusCode === 500 ? "Erreur serveur" : error.message
//         });
//     }
// };


// exports.downloadFacture = async (req, res) => {
//     try {
//         const { id } = req.params;
//         console.log("ID Odoo reçu :", id);

//         const facture = await Facture.findOne({ odooInvoiceId: id });

//         if (!facture) {
//             return res.status(404).json({ message: "Facture non trouvée dans MongoDB" });
//         }

//         // 🔵 Appel Odoo pour récupérer le PDF
       
//         const response = await axios({
//             method: 'GET',
//             url: `${process.env.ODOO_URL}/report/pdf/account.report_invoice/${facture.odooInvoiceId}`,  // <-- ici "account.report_invoice"
//             headers: {
//               Authorization: `Bearer ${token}`, // ou autre méthode d'authentification si besoin
//             },
//             responseType: 'arraybuffer', // Pour recevoir le fichier PDF brut
//           });
//         console.log("Réponse Odoo reçue :", response.data);          

//         // 🔵 Retourne directement le fichier PDF au client
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', `attachment; filename=facture_${facture.name}.pdf`);
//         res.send(response.data);

//         // 🔵 (optionnel) Sauvegarder le PDF localement si tu veux
//         // fs.writeFileSync(`facture_${facture.name}.pdf`, response.data);

//     } catch (error) {
//         console.error("Erreur complète:", {
//             odooId: null,
//             error: error.message,
//             stack: error.stack
//         });

//         const statusCode = error.response?.status || 500;
//         res.status(statusCode).json({
//             error: "Impossible de télécharger la facture",
//             details: statusCode === 500 ? "Erreur serveur" : error.message
//         });
//     }
// };

// exports.downloadFacture = async (req, res) => {
//     try {
//         const { id } = req.params; // id = l'id Odoo envoyé
//         console.log("ID Odoo reçu :", id);

//         const facture = await Facture.findOne({ odooInvoiceId: id });

//         if (!facture) {
//             return res.status(404).json({ message: "Facture non trouvée dans MongoDB" });
//         }

//         // Appel à Odoo pour télécharger le PDF ici...

//     } catch (error) {
//         console.error("Erreur complète:", {
//             odooId: null,
//             error: error.message,
//             stack: error.stack
//         });

//         const statusCode = error.response?.status || 500;
//         res.status(statusCode).json({
//             error: "Impossible de récupérer la facture",
//             details: statusCode === 500 ? "Erreur serveur" : error.message
//         });
//     }
// };


// const { getFactureById } = require('../services/odooService');

// exports.downloadFacture = async (req, res) => {
//     try {
//         const factureId = req.params.id;

//         const facture = await getFactureById(factureId);

//         if (!facture) {
//             return res.status(404).json({ error: "Facture introuvable" });
//         }

//         // Pour l'instant on renvoie juste les infos JSON (plus tard on gèrera le PDF si tu veux)
//         res.json(facture);

//     } catch (error) {
//         console.error('Erreur complète:', error.message);
//         res.status(500).json({ error: "Erreur serveur" });
//     }
// };

// controllers/factureController.js
// const { authenticate } = require('../utils/odooAuth');
// const axios = require('axios');

// exports.downloadFacture = async (req, res) => {
//     try {
//         const { facture } = req; // Récupéré du middleware verifyFacture

//         // Authentification avec gestion d'erreur améliorée
//         const sessionId = await authenticate();
        
//         // Vérification de l'existence de la facture
//         const checkResponse = await axios.get(
//             `${process.env.ODOO_URL}/api/account.move/${facture.odooInvoiceId}/exists`,
//             {
//                 headers: { 'Cookie': `session_id=${sessionId}` },
//                 timeout: 5000
//             }
//         );

//         if (!checkResponse.data.exists) {
//             throw new Error(`Facture ${facture.odooInvoiceId} introuvable dans Odoo`);
//         }

//         // Téléchargement du PDF
//         const pdfResponse = await axios.get(
//             `${process.env.ODOO_URL}/api/account.move/${facture.odooInvoiceId}/pdf`,
//             {
//                 responseType: 'stream',
//                 headers: { 'Cookie': `session_id=${sessionId}` },
//                 timeout: 15000
//             }
//         );

//         // Configuration des headers de réponse
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', `attachment; filename="facture_${facture.numeroFacture}.pdf"`);

//         // Stream du PDF
//         pdfResponse.data.pipe(res);

//     } catch (error) {
//         console.error("Erreur complète:", {
//             odooId: req?.facture?.odooInvoiceId, // <-- Correction ici
//             error: error.message,
//             stack: error.stack
//         });

//         const statusCode = error.response?.status || 500;
//         res.status(statusCode).json({
//             error: "Impossible de récupérer la facture",
//             details: statusCode === 500 ? "Erreur serveur" : error.message
//         });
//     }
// };
exports.createFacture = async (req, res) => {
    try {
      // Vérification de l'ID client
      if (!mongoose.Types.ObjectId.isValid(req.body.client)) {
        return res.status(400).json({ message: "ID du client invalide." });
      }
  
      // Générer automatiquement le numéro de facture s'il n'est pas fourni
      if (!req.body.numeroFacture) {
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        
        // Compter le nombre de factures déjà créées aujourd'hui
        const count = await Facture.countDocuments({
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        });
  
        const numeroAuto = `FACT-${datePart}-${String(count + 1).padStart(3, '0')}`;
        req.body.numeroFacture = numeroAuto;
      }
  
      const newFacture = new Facture(req.body);
      await newFacture.save();
  
      res.status(201).json({ message: "Facture créée avec succès", facture: newFacture });
    } catch (error) {
      console.error("Erreur lors de la création de la facture :", error);
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };

  
exports.afficherFacture = async (req, res) => {
    try {
        const facture = await Facture.findById(req.params.id)
            .populate('admin', 'nom email')
            .populate('technicien', 'nom')
            .populate('client', 'nom');

        if (!facture) {
            return res.status(404).json({ message: "Facture non trouvée" });
        }

        return res.status(200).json(facture);
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de la récupération de la facture",
            error: error.message
        });
    }
};

exports.afficherToutesLesFactures = async (req, res) => {
    try {
        const factures = await Facture.find()
            .populate('admin', 'nom email')
            .populate('technicien', 'nom')
            .populate('client', 'nom');

        if (factures.length === 0) {
            return res.status(404).json({ message: "Aucune facture trouvée" });
        }

        return res.status(200).json(factures);
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de la récupération des factures",
            error: error.message
        });
    }
};

exports.mettreAJourFacture = async (req, res) => {
    try {
        const factureId = req.params.id;
        const { montant, service, technicien, client } = req.body;

        const factureMiseAJour = await Facture.findByIdAndUpdate(factureId, {
            montant,
            service,
            technicien,
            client
        }, { new: true });

        if (!factureMiseAJour) {
            return res.status(404).json({ message: "Facture non trouvée" });
        }

        return res.status(200).json({
            message: "Facture mise à jour avec succès",
            facture: factureMiseAJour
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de la mise à jour de la facture",
            error: error.message
        });
    }
};

exports.supprimerFacture = async (req, res) => {
    try {
        const factureId = req.params.id;

        const factureSupprimee = await Facture.findByIdAndDelete(factureId);

        if (!factureSupprimee) {
            return res.status(404).json({ message: "Facture non trouvée" });
        }

        return res.status(200).json({ message: "Facture supprimée avec succès" });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de la suppression de la facture",
            error: error.message
        });
    }
};


