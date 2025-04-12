const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/', authenticate, messageController.createMessage);
router.get('/recus', authenticate, messageController.getMessagesRecus);
router.get('/envoyes', authenticate, messageController.getMessagesEnvoyes);
router.get('/:id', authenticate, messageController.getMessageById);
router.delete('/:id', authenticate, messageController.deleteMessage);

module.exports = router;
