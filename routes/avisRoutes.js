const express = require("express");
const router = express.Router();
const avisController = require("../controllers/avisController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Routes avec verification de l'utilisateur connecte
router.post("/", authMiddleware, avisController.creerAvis); // Uniquement pour les clients
//router.delete("/:id", authMiddleware, avisController.deleteAvis); // Suppression propre avis

// Routes accessible a tous
router.get("/", avisController.getAllAvis);
router.get("/:id", avisController.getAvisById);

module.exports = router;
