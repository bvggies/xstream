const express = require('express');
const {
  getMatches,
  getMatchById,
  watchMatch,
  proxyM3U8,
} = require('../controllers/matchController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', getMatches);
router.get('/proxy-m3u8', proxyM3U8); // Proxy endpoint for M3U8 streams
router.get('/:id', getMatchById);
router.post('/:id/watch', authenticate, watchMatch);

module.exports = router;

