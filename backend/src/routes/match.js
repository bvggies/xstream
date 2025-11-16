const express = require('express');
const {
  getMatches,
  getMatchById,
  watchMatch,
} = require('../controllers/matchController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', getMatches);
router.get('/:id', getMatchById);
router.post('/:id/watch', authenticate, watchMatch);

module.exports = router;

