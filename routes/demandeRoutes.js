const express = require("express");
const router = express.Router();
const demandeController = require("../controllers/demandeController");

router.post("/", demandeController.creerDemande);
router.get("/:id", demandeController.getDemandeById);
router.get("/", demandeController.getAllDemandes);


router.put("/:id", demandeController.updateDemande);
router.delete("/:id", demandeController.deleteDemande);

module.exports = router;
