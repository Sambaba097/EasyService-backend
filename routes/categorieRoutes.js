const express = require("express");
const router = express.Router();
const categorieController = require("../controllers/categorieController");


router.post("/ajouter/categorie", categorieController.createCategorie);
router.get("/all/categories", categorieController.getAllCategories);
router.get("/:id", categorieController.getCategorieById);
router.put("/modifierCategorie/:id", categorieController.updateCategorie);
router.delete("/supprimerCategorie/:id", categorieController.deleteCategorie);

module.exports = router;