const prisma = require('../utils/prisma');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const axios = require('axios');

const getMatches = async (req, res, next) => {
  try {
    const { status, league } = req.query;
    const where = {};

    // Parse status array (handle comma-separated or single values)
    let statusArray = [];
    if (status) {
      statusArray = status.includes(',') ? status.split(',').map(s => s.trim()) : [status.trim()];
    }

    if (status) {
      if (statusArray.length === 1) {
        // Single status value
        if (statusArray[0] === 'FINISHED') {
          where.status = 'FINISHED';
        } else {
          where.status = statusArray[0];
        }
      } else {
        // Multiple status values - use 'in' operator
        where.status = { in: statusArray };
      }
    } else {
      // Default: show LIVE and UPCOMING (not FINISHED)
      where.status = { in: ['LIVE', 'UPCOMING'] };
    }

    if (league) {
      where.league = league;
    }

    // Handle date filtering for specific statuses
    if (statusArray.length === 1 && statusArray[0] === 'UPCOMING') {
      // For UPCOMING status, only show future matches
      where.matchDate = { gte: new Date() };
    } else if (statusArray.length === 1 && statusArray[0] === 'LIVE') {
      // LIVE matches: show regardless of date (they stay until manually ended)
      // Also include UPCOMING matches that have started (matchDate <= now) - treat as LIVE
      where.OR = [
        { status: 'LIVE' },
        {
          status: 'UPCOMING',
          matchDate: { lte: new Date() },
        },
      ];
      delete where.status;
    } else if (!status) {
      // Default (no status filter): show all LIVE and UPCOMING matches
      // Don't apply date restrictions - show all matches regardless of date
      // This allows showing both past UPCOMING matches (that should be LIVE) and future ones
    }
    // LIVE matches stay visible until status is changed to FINISHED

    const matches = await prisma.match.findMany({
      where,
      include: {
        streamingLinks: {
          where: { isActive: true },
          select: {
            id: true,
            url: true,
            type: true,
            quality: true,
            views: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // LIVE first
        { matchDate: 'asc' },
      ],
      take: 100,
    });

    res.json({ matches });
  } catch (error) {
    next(error);
  }
};

const getMatchById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        homeTeam: true,
        awayTeam: true,
        homeTeamLogo: true,
        awayTeamLogo: true,
        league: true,
        leagueLogo: true,
        thumbnail: true,
        status: true,
        matchDate: true,
        endTime: true,
        streamingLinks: {
          where: { isActive: true },
          select: {
            id: true,
            url: true,
            type: true,
            quality: true,
            views: true,
          },
          orderBy: { views: 'desc' },
        },
      },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json({ match });
  } catch (error) {
    next(error);
  }
};

const watchMatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Add to watch history
    await prisma.watchHistory.upsert({
      where: {
        userId_matchId: {
          userId,
          matchId: id,
        },
      },
      update: {
        watchedAt: new Date(),
      },
      create: {
        userId,
        matchId: id,
      },
    });

    // Increment link views if linkId provided
    const { linkId } = req.body;
    if (linkId) {
      await prisma.streamingLink.update({
        where: { id: linkId },
        data: {
          views: {
            increment: 1,
          },
        },
      });
    }

    // Update analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.analytics.upsert({
      where: { date: today },
      update: {
        matchViews: {
          increment: 1,
        },
      },
      create: {
        date: today,
        matchViews: 1,
      },
    });

    res.json({ message: 'Match watched' });
  } catch (error) {
    next(error);
  }
};

// Helper function to get base URL for proxy
const getBaseUrl = (req) => {
  // Try to get from environment variable first (for Vercel)
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  // Fallback to constructing from request
  // On Vercel, use x-forwarded-proto header
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || req.headers.host;
  
  if (!host) {
    // Last resort: use Vercel URL from environment
    console.warn('Could not determine host from request, using fallback');
    return 'https://xstream-backend.vercel.app';
  }
  
  return `${protocol}://${host}`;
};

// Proxy M3U8 manifest to bypass CORS and rewrite URLs
const proxyM3U8 = async (req, res, next) => {
  try {
    const { url: streamUrl } = req.query;

    if (!streamUrl) {
      return res.status(400).json({ error: 'Stream URL is required' });
    }

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(streamUrl);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Only HTTP/HTTPS URLs are allowed' });
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    try {
      const response = await axios.get(streamUrl, {
        responseType: 'text',
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*',
          'Accept-Language': '*',
        },
        timeout: 60000, // 60 second timeout
        maxRedirects: 5,
      });

      let body = response.data;

      // Get base URL for proxy
      const baseUrl = getBaseUrl(req);
      const proxyBaseUrl = `${baseUrl}/api/matches/proxy`;
      
      console.log('Proxy M3U8 - Base URL:', baseUrl);
      console.log('Proxy M3U8 - Proxy Base URL:', proxyBaseUrl);
      console.log('Proxy M3U8 - Original URL:', streamUrl);

      // Get base URL for resolving relative paths
      const pathParts = parsedUrl.pathname.split('/').filter(p => p);
      const basePath = pathParts.length > 0 
        ? `/${pathParts.slice(0, -1).join('/')}/` 
        : '/';
      const baseUrlForResolve = `${parsedUrl.protocol}//${parsedUrl.host}${basePath}`;

      // Process line by line to rewrite URLs
      const lines = body.split('\n');
      const rewrittenLines = lines.map((line) => {
        const trimmedLine = line.trim();
        // Skip comments and empty lines
        if (trimmedLine.startsWith('#') || !trimmedLine) {
          return line; // Keep original line (preserve whitespace)
        }
        
        // Skip data URIs
        if (trimmedLine.startsWith('data:')) {
          return line;
        }
        
        // Check if this line is already proxied (contains our proxy URL)
        if (trimmedLine.includes(proxyBaseUrl)) {
          return line; // Already proxied, skip
        }
        
        // Handle absolute URLs
        if (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://')) {
          return `${proxyBaseUrl}?url=${encodeURIComponent(trimmedLine)}`;
        }
        
        // Handle relative URLs - make them absolute first, then proxy
        try {
          let absoluteUrl;
          if (trimmedLine.startsWith('/')) {
            // Absolute path on same domain
            absoluteUrl = new URL(trimmedLine, `${parsedUrl.protocol}//${parsedUrl.host}`);
          } else {
            // Relative path
            absoluteUrl = new URL(trimmedLine, baseUrlForResolve);
          }
          // Now proxy the absolute URL
          return `${proxyBaseUrl}?url=${encodeURIComponent(absoluteUrl.href)}`;
        } catch (e) {
          // If URL construction fails, try simple concatenation
          console.warn('Failed to construct absolute URL for:', trimmedLine, e.message);
          const absoluteUrl = trimmedLine.startsWith('/') 
            ? `${parsedUrl.protocol}//${parsedUrl.host}${trimmedLine}`
            : `${parsedUrl.protocol}//${parsedUrl.host}${basePath}${trimmedLine}`;
          return `${proxyBaseUrl}?url=${encodeURIComponent(absoluteUrl)}`;
        }
      });
      body = rewrittenLines.join('\n');
      
      console.log('Proxy M3U8 - Rewritten playlist (first 500 chars):', body.substring(0, 500));

      res.setHeader('Content-Type', 'application/vnd.apple.mpegURL');
      res.send(body);
    } catch (err) {
      console.error('Proxy M3U8 error:', err.message);
      if (err.response) {
        res.status(err.response.status).json({ 
          error: 'Proxy failed', 
          detail: err.message,
          status: err.response.status 
        });
      } else if (err.code === 'ECONNABORTED') {
        res.status(504).json({ 
          error: 'Request timeout',
          message: 'The stream server did not respond within 60 seconds. The stream may be down or unreachable.',
          url: streamUrl
        });
      } else {
        res.status(500).json({ 
          error: 'Proxy failed', 
          detail: err.message,
          url: streamUrl
        });
      }
    }
  } catch (error) {
    console.error('Proxy M3U8 error:', error);
    next(error);
  }
};

// Proxy segments, child playlists, key files, etc.
const proxySegment = async (req, res, next) => {
  try {
    const { url: fileUrl } = req.query;

    if (!fileUrl) {
      return res.status(400).json({ error: 'File URL is required' });
    }

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(fileUrl);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Only HTTP/HTTPS URLs are allowed' });
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    try {
      console.log('Proxy Segment - Fetching:', fileUrl);
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*',
        },
        timeout: 60000, // 60 second timeout
        maxRedirects: 5,
      });
      
      console.log('Proxy Segment - Success, Content-Type:', response.headers['content-type']);

      // Determine content type based on file extension or response headers
      let contentType = response.headers['content-type'];
      if (!contentType) {
        const ext = fileUrl.split('.').pop()?.toLowerCase();
        const contentTypes = {
          'ts': 'video/mp2t',
          'm4s': 'video/iso.segment',
          'key': 'application/octet-stream',
          'm3u8': 'application/vnd.apple.mpegURL',
        };
        contentType = contentTypes[ext] || 'application/octet-stream';
      }

      res.setHeader('Content-Type', contentType);
      
      // Copy relevant headers
      if (response.headers['content-length']) {
        res.setHeader('Content-Length', response.headers['content-length']);
      }
      if (response.headers['cache-control']) {
        res.setHeader('Cache-Control', response.headers['cache-control']);
      }

      res.send(Buffer.from(response.data));
    } catch (err) {
      console.error('Proxy segment error:', err.message);
      if (err.response) {
        res.status(err.response.status).json({ 
          error: 'Segment proxy failed', 
          detail: err.message,
          status: err.response.status 
        });
      } else if (err.code === 'ECONNABORTED') {
        res.status(504).json({ 
          error: 'Request timeout',
          message: 'The segment server did not respond within 60 seconds.',
          url: fileUrl
        });
      } else {
        res.status(500).json({ 
          error: 'Segment proxy failed', 
          detail: err.message,
          url: fileUrl
        });
      }
    }
  } catch (error) {
    console.error('Proxy segment error:', error);
    next(error);
  }
};

module.exports = {
  getMatches,
  getMatchById,
  watchMatch,
  proxyM3U8,
  proxySegment,
};

