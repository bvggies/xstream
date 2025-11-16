const express = require('express');
const { getChatHistory, sendMessage } = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/history', getChatHistory);
router.post('/send', [body('message').notEmpty().trim()], validate, sendMessage);

module.exports = router;

