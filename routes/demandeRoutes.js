const express = require("express");
const router = express.Router();
const demandeController = require("../controllers/demandeController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Routes avec verification de l'authentification
router.post("/", authMiddleware, demandeController.creerDemande);
router.put("/:id", authMiddleware, demandeController.updateDemande);
router.delete("/:id", authMiddleware, demandeController.deleteDemande);

// Routes accessible par tous
router.get("/:id", demandeController.getDemandeById);
router.get("/", demandeController.getAllDemandes);

module.exports = router;
