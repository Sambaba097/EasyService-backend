const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate, roleMiddleware } = require('../middleware/authMiddleware');

// Routes pour tous les utilisateurs
router.post('/', authenticate, messageController.createMessage);
router.get('/recus', authenticate, messageController.getReceivedMessages);
router.get('/envoyes', authenticate, messageController.getSentMessages);
router.get('/demande/:demandeId', authenticate, messageController.getMessagesByDemande);
router.patch('/:id/lu', authenticate, messageController.markAsRead);
router.get('/non-lus/count', authenticate, messageController.getUnreadCount);
router.delete('/:id', authenticate, messageController.deleteMessage);

// Routes spécifiques à l'admin
router.get('/admin', authenticate, roleMiddleware('admin'), messageController.getAdminMessages);

module.exports = router;