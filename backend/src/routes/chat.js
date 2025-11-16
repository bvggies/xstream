const express = require('express');
const { getChatHistory, sendMessage, getUnreadCount, markMessagesAsSeen } = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/history', getChatHistory);
router.get('/unread-count', getUnreadCount);
router.post('/send', [body('message').notEmpty().trim()], validate, sendMessage);
router.post('/mark-seen', markMessagesAsSeen);

module.exports = router;

