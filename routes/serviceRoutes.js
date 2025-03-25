const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const { uploadService } = require("../config/multer"); 

// Routes avec contrôleurs
router.post("/ajouter/service", uploadService.single("image"), serviceController.createService);
router.get("/afficher/service", serviceController.getAllServices);
router.get("/:id", serviceController.getServiceById);
router.put("/:id", uploadService.single("image"), serviceController.updateService);
router.delete("/:id", serviceController.deleteService);

module.exports = router;