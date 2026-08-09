const jwt = require('jsonwebtoken');
const config = require('../config');

function requireApiSecret(req, res, next) {
  const secret = req.headers['x-api-secret'];
  if (!secret || secret !== config.apiSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function requireBearerApiSecret(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Bearer authentication required' });
  }
  const token = authHeader.slice(7).trim();
  if (!token || token !== config.apiSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, config.jwtSecret);
    if (!payload.admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireApiSecret, requireBearerApiSecret, requireAdmin };
