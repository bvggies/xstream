const express = require('express');
const { body } = require('express-validator');
const {
  updateProfile,
  updatePassword,
  getWatchHistory,
  addFavoriteLeague,
  removeFavoriteLeague,
  getNotifications,
  markNotificationRead,
  reportBrokenLink,
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);

router.put('/profile', upload.single('avatar'), updateProfile);
router.put('/password', [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 8 })], validate, updatePassword);
router.get('/watch-history', getWatchHistory);
router.post('/favorite-leagues', [body('league').notEmpty()], validate, addFavoriteLeague);
router.delete('/favorite-leagues/:league', removeFavoriteLeague);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.post('/report', [body('matchId').notEmpty(), body('reason').notEmpty()], validate, reportBrokenLink);

module.exports = router;

