const express = require("express");
const router = express.Router();
const avisController = require("../controllers/avisController");
const { authenticate, roleMiddleware } = require("../middleware/authMiddleware"); // Importation du middleware des rôles

// Routes avec vérification de l'utilisateur connecté et des rôles
router.post("/ajouter", authenticate, roleMiddleware(["client"]), avisController.creerAvis); // Uniquement pour les clients
router.delete("/:id", authenticate, roleMiddleware(["client", "admin"]), avisController.deleteAvis);

// Routes accessibles à tous
router.get("/", avisController.getAllAvis);
router.get("/:id", avisController.getAvisById);

module.exports = router;
