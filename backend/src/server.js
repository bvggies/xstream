const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

// Load environment variables
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not available, using environment variables');
}

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const matchRoutes = require('./routes/match');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting - adjust for serverless
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

// Health check - handle both /api/health and /health
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Root path
app.get('/', (req, res) => {
  res.json({ 
    message: 'Xstream API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      matches: '/api/matches'
    }
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// For Vercel serverless functions
module.exports = app;

// For local development with Socket.io
if (process.env.NODE_ENV !== 'production' && require.main === module) {
  const { createServer } = require('http');
  const { Server } = require('socket.io');
  const { initializeSocket } = require('./socket/socketHandler');

  const httpServer = createServer(app);
  
  // Socket.io setup (only for local development)
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  initializeSocket(io);

  const PORT = process.env.PORT || 5000;

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
