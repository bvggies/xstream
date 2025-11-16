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

// CORS configuration - more permissive for Vercel
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://xstream-wheat.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      /\.vercel\.app$/, // Allow all Vercel preview deployments
    ];

    // Also check environment variable
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
      // Also add without trailing slash
      if (process.env.FRONTEND_URL.endsWith('/')) {
        allowedOrigins.push(process.env.FRONTEND_URL.slice(0, -1));
      } else {
        allowedOrigins.push(process.env.FRONTEND_URL + '/');
      }
    }

    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed || origin === allowed + '/' || origin === allowed.slice(0, -1);
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });

    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production' || isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting - more lenient for serverless/Vercel
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased limit for serverless (IPs might be shared)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/api/health' || req.path === '/health',
  // Use a more lenient key generator for serverless
  keyGenerator: (req) => {
    // In serverless, use a combination of IP and user agent
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
});

// Apply rate limiting only to API routes (not health checks)
app.use('/api/', (req, res, next) => {
  // Skip rate limiting for health endpoint
  if (req.path === '/health') {
    return next();
  }
  return limiter(req, res, next);
});

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
    env: process.env.NODE_ENV || 'development',
    cors: process.env.FRONTEND_URL || 'not set',
    origin: req.headers.origin || 'no origin'
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
