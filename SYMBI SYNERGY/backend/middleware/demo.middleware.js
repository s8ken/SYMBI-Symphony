const rateLimit = require('express-rate-limit');
const asyncHandler = require('express-async-handler');

// Demo mode configuration
const isDemoMode = () => process.env.NODE_ENV === 'demo' || process.env.DEMO_MODE === 'true';

// Demo rate limiter - more restrictive than production
const demoRateLimit = rateLimit({
  windowMs: parseInt(process.env.DEMO_RATE_WINDOW || '900') * 1000, // 15 minutes
  max: parseInt(process.env.DEMO_RATE_LIMIT || '50'), // 50 requests per window
  message: {
    success: false,
    error: 'Demo Rate Limit',
    message: 'Too many requests in demo mode. Please wait before trying again.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Demo user restrictions middleware
const demoRestrictions = asyncHandler(async (req, res, next) => {
  if (!isDemoMode()) {
    return next();
  }

  // Add demo headers
  res.set('X-Demo-Mode', 'true');
  res.set('X-Demo-Notice', 'This is a demo environment with limited functionality');

  // Check for demo-restricted operations
  const restrictedPaths = [
    '/api/users/account', // DELETE account
    '/api/webhooks', // All webhook operations
    '/api/trust/.*/audit', // Trust audits
    '/api/events' // Event creation (POST)
  ];

  const isRestricted = restrictedPaths.some(pattern => {
    const regex = new RegExp(pattern);
    return regex.test(req.path) && ['DELETE', 'POST'].includes(req.method);
  });

  if (isRestricted) {
    return res.status(403).json({
      success: false,
      error: 'Demo Restriction',
      message: 'This operation is disabled in demo mode',
      demoMode: true
    });
  }

  next();
});

// Demo data seeding middleware
const demoDataSeed = asyncHandler(async (req, res, next) => {
  if (!isDemoMode()) {
    return next();
  }

  // Add demo context to request
  req.demoMode = true;
  req.demoLimits = {
    maxConversations: parseInt(process.env.DEMO_MAX_CONVERSATIONS_PER_USER || '3'),
    maxMessages: parseInt(process.env.DEMO_MAX_MESSAGES_PER_CONVERSATION || '10'),
    maxUsers: parseInt(process.env.DEMO_MAX_USERS || '100')
  };

  next();
});

// Demo analytics tracking
const demoAnalytics = asyncHandler(async (req, res, next) => {
  if (!isDemoMode()) {
    return next();
  }

  // Track demo usage (you could send to analytics service)
  const demoEvent = {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    sessionId: req.sessionID
  };

  // Log demo usage
  console.log('Demo Usage:', JSON.stringify(demoEvent));
  
  next();
});

module.exports = {
  isDemoMode,
  demoRateLimit,
  demoRestrictions,
  demoDataSeed,
  demoAnalytics
};