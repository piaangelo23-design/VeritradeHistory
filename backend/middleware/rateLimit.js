const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts.' }
});

const botLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Bot rate limit exceeded.' }
});

module.exports = { apiLimiter, authLimiter, botLimiter };
