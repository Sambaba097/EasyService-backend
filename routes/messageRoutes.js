const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate, roleMiddleware } = require('../middleware/authMiddleware');
const { validateMessage } = require('../middleware/validationMiddleware');

// Routes pour tous les utilisateurs
router.post('/', authenticate, validateMessage, authenticate, messageController.createMessage);
router.get('/recus', authenticate, messageController.getReceivedMessages);
router.get('/envoyes', authenticate, messageController.getSentMessages);
router.get('/demande/:demandeId', authenticate, messageController.getMessagesByDemande);
router.get('/:id', authenticate, messageController.getMessageById);
router.put('/:id/lu', authenticate, messageController.markAsRead);
router.get('/non-lus/count', authenticate, messageController.getUnreadCount);
router.delete('/:id', authenticate, messageController.deleteMessage);

// Routes spécifiques à l'admin
router.get('/admin', authenticate, roleMiddleware(['admin']), messageController.getAdminMessages);

module.exports = router;