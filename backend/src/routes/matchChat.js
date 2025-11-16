const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getMatchChatHistory, sendMatchChatMessage } = require('../controllers/matchChatController');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get chat history for a match
router.get('/:matchId', getMatchChatHistory);

// Send a message in match chat
router.post(
  '/:matchId',
  [body('message').trim().notEmpty().isLength({ min: 1, max: 500 })],
  validate,
  sendMatchChatMessage
);

module.exports = router;

