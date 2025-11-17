const prisma = require('../utils/prisma');
const https = require('https');
const http = require('http');
const { URL } = require('url');

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

// Proxy M3U8 manifest to bypass CORS
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

    const client = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': '*',
      },
      timeout: 60000, // 60 second timeout for slow IPTV streams
    };

    const proxyReq = client.get(streamUrl, options, (proxyRes) => {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/vnd.apple.mpegurl');

      // Handle redirects
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        return res.redirect(proxyRes.statusCode, `/api/matches/proxy-m3u8?url=${encodeURIComponent(proxyRes.headers.location)}`);
      }

      res.status(proxyRes.statusCode);

      let data = '';
      proxyRes.on('data', (chunk) => {
        data += chunk;
      });

      proxyRes.on('end', () => {
        // Rewrite relative URLs in M3U8 manifest to absolute URLs
        // This ensures child playlists and segments load from the original server
        if (data.includes('#EXT') || data.includes('.m3u8') || data.includes('.ts')) {
          // Get base URL for resolving relative paths
          const pathParts = parsedUrl.pathname.split('/').filter(p => p);
          const basePath = pathParts.length > 0 
            ? `/${pathParts.slice(0, -1).join('/')}/` 
            : '/';
          const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}${basePath}`;
          
          const lines = data.split('\n');
          const rewrittenLines = lines.map((line) => {
            const trimmedLine = line.trim();
            // Skip comments and empty lines
            if (trimmedLine.startsWith('#') || !trimmedLine) {
              return line; // Keep original line (preserve whitespace)
            }
            // If line is a URL and it's relative, make it absolute
            if (!trimmedLine.startsWith('http://') && !trimmedLine.startsWith('https://') && !trimmedLine.startsWith('data:')) {
              try {
                // Handle relative paths correctly
                let absoluteUrl;
                if (trimmedLine.startsWith('/')) {
                  // Absolute path on same domain
                  absoluteUrl = new URL(trimmedLine, `${parsedUrl.protocol}//${parsedUrl.host}`);
                } else {
                  // Relative path
                  absoluteUrl = new URL(trimmedLine, baseUrl);
                }
                return absoluteUrl.href;
              } catch (e) {
                // If URL construction fails, try simple concatenation
                console.warn('Failed to construct absolute URL for:', trimmedLine, e.message);
                return trimmedLine.startsWith('/') 
                  ? `${parsedUrl.protocol}//${parsedUrl.host}${trimmedLine}`
                  : `${baseUrl}${trimmedLine}`;
              }
            }
            return line; // Keep absolute URLs as-is
          });
          data = rewrittenLines.join('\n');
        }

        res.send(data);
      });
    });

    // Set timeout
    proxyReq.setTimeout(60000, () => {
      console.error('Proxy timeout for URL:', streamUrl);
      proxyReq.destroy();
      if (!res.headersSent) {
        res.status(504).json({ 
          error: 'Request timeout',
          message: 'The stream server did not respond within 60 seconds. The stream may be down or unreachable.',
          url: streamUrl
        });
      }
    });

    proxyReq.on('error', (error) => {
      console.error('Proxy error for URL:', streamUrl, error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to fetch stream',
          message: error.message || 'Unable to connect to stream server',
          url: streamUrl
        });
      }
    });

  } catch (error) {
    console.error('Proxy M3U8 error:', error);
    next(error);
  }
};

module.exports = {
  getMatches,
  getMatchById,
  watchMatch,
  proxyM3U8,
};

