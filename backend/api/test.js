// Simple test function to verify Vercel functions work
module.exports = (req, res) => {
  res.json({ 
    message: 'Vercel function works!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
};

