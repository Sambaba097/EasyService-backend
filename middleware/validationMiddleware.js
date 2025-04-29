// validationMiddleware.js
const { body } = require('express-validator');

exports.validateMessage = [
  body('titre').trim().notEmpty().withMessage('Le titre est requis')
    .isLength({ max: 100 }).withMessage('Le titre ne doit pas dépasser 100 caractères'),
  
  body('objet').trim().notEmpty().withMessage('L\'objet est requis')
    .isLength({ max: 200 }).withMessage('L\'objet ne doit pas dépasser 200 caractères'),
    
  body('contenu').trim().notEmpty().withMessage('Le contenu est requis'),
  
  body('destinataires').isArray({ min: 1 }).withMessage('Au moins un destinataire est requis'),
  
  body('destinataires.*').custom(value => {
    // Valide que chaque destinataire est soit un email valide, soit un ObjectId valide
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(value);
    if (!isEmail && !isObjectId) {
      throw new Error('Chaque destinataire doit être un email valide ou un ID utilisateur');
    }
    return true;
  }),
  
  body('demandeId').optional().isMongoId().withMessage('ID de demande invalide')
];