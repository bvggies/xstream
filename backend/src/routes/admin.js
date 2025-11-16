const express = require('express');
const {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  banUser,
  unbanUser,
  createMatch,
  updateMatch,
  deleteMatch,
  addStreamingLink,
  updateStreamingLink,
  deleteStreamingLink,
  getReports,
  updateReportStatus,
  getAuditLogs,
  getAnalytics,
} = require('../controllers/adminController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);
router.use(authorizeAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/unban', unbanUser);

router.post('/matches', upload.single('thumbnail'), [
  body('title').notEmpty(),
  body('homeTeam').notEmpty(),
  body('awayTeam').notEmpty(),
  body('league').notEmpty(),
  body('matchDate').isISO8601(),
], validate, createMatch);

router.put('/matches/:id', upload.single('thumbnail'), updateMatch);
router.delete('/matches/:id', deleteMatch);

router.post('/matches/:matchId/links', [
  body('url').notEmpty().isURL(),
  body('type').isIn(['HLS', 'M3U8', 'IFRAME', 'DIRECT']),
], validate, addStreamingLink);

router.put('/matches/:matchId/links/:linkId', updateStreamingLink);
router.delete('/matches/:matchId/links/:linkId', deleteStreamingLink);

router.get('/reports', getReports);
router.put('/reports/:id', [
  body('status').isIn(['PENDING', 'RESOLVED', 'REJECTED']),
], validate, updateReportStatus);

router.get('/audit-logs', getAuditLogs);
router.get('/analytics', getAnalytics);

module.exports = router;

