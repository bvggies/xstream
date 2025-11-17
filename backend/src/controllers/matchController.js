const prisma = require('../utils/prisma');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const getMatches = async (req, res, next) => {
  try {
    const { status, league } = req.query;
    const where = {};

    if (status) {
      if (status === 'FINISHED') {
        // Show finished matches
        where.status = 'FINISHED';
      } else {
        where.status = status;
      }
    } else {
      // Default: show LIVE and UPCOMING (not FINISHED)
      where.status = { in: ['LIVE', 'UPCOMING'] };
    }

    if (league) {
      where.league = league;
    }

    // For UPCOMING status, only show future matches
    if (status === 'UPCOMING') {
      where.matchDate = { gte: new Date() };
    } else if (status === 'LIVE') {
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
    } else if (!status && where.status.in) {
      // Default: show LIVE matches (regardless of date) and UPCOMING matches (future dates)
      // Also include UPCOMING matches that have started (matchDate <= now) - treat as LIVE
      where.OR = [
        { status: 'LIVE' },
        {
          status: 'UPCOMING',
          matchDate: { gte: new Date() },
        },
        {
          status: 'UPCOMING',
          matchDate: { lte: new Date() },
        },
      ];
      delete where.status;
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
        if (data.includes('#EXT') || data.includes('.m3u8') || data.includes('.ts')) {
          const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname.substring(0, parsedUrl.pathname.lastIndexOf('/') + 1)}`;
          const lines = data.split('\n');
          const rewrittenLines = lines.map((line) => {
            // Skip comments and empty lines
            if (line.trim().startsWith('#') || !line.trim()) {
              return line;
            }
            // If line is a URL and it's relative, make it absolute
            if (line.trim() && !line.trim().startsWith('http://') && !line.trim().startsWith('https://')) {
              try {
                const absoluteUrl = new URL(line.trim(), baseUrl);
                return absoluteUrl.href;
              } catch (e) {
                // If URL construction fails, try simple concatenation
                return baseUrl + line.trim();
              }
            }
            return line;
          });
          data = rewrittenLines.join('\n');
        }

        res.send(data);
      });
    });

    // Set timeout
    proxyReq.setTimeout(60000, () => {
      proxyReq.destroy();
      if (!res.headersSent) {
        res.status(504).json({ error: 'Request timeout' });
      }
    });

    proxyReq.on('error', (error) => {
      console.error('Proxy error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to fetch stream',
          message: error.message 
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

