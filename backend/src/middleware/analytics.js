const { trackPageView } = require('../utils/analytics');

const analyticsMiddleware = (req, res, next) => {
  // Track page views for non-API routes or specific API routes
  if (req.path.startsWith('/api/matches') || req.path.startsWith('/api/')) {
    trackPageView(req);
  }
  next();
};

module.exports = { analyticsMiddleware };

