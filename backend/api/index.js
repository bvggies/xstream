// Vercel serverless function entry point
try {
  console.log('Loading server...');
  const app = require('../src/server');
  console.log('Server loaded successfully');
  
  module.exports = app;
} catch (error) {
  console.error('Error loading server:', error);
  console.error('Stack:', error.stack);
  
  // Return a simple error handler
  const express = require('express');
  const errorApp = express();
  
  errorApp.use((req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  });
  
  module.exports = errorApp;
}
