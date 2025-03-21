const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");

// Routes avec contrôleurs
router.post("/ajouter/service", serviceController.createService);
router.get("/afficher/service", serviceController.getAllServices);
router.get("/:id", serviceController.getServiceById);
router.put("/:id", serviceController.updateService);
router.delete("/:id", serviceController.deleteService);

module.exports = router;