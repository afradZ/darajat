const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authenticateToken = require('../middleware/auth');

// Public route
router.post('/contact', messageController.createMessage);

// Protected Admin routes
router.get('/admin/messages', authenticateToken, messageController.getMessages);
router.put('/admin/messages/:id/lu', authenticateToken, messageController.markAsRead);
router.delete('/admin/messages/:id', authenticateToken, messageController.deleteMessage);

module.exports = router;