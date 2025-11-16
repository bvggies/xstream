const express = require('express');
const { getHighlights, getHighlightById, incrementViews } = require('../controllers/highlightController');

const router = express.Router();

router.get('/', getHighlights);
router.get('/:id', getHighlightById);
router.patch('/:id/views', incrementViews);

module.exports = router;

