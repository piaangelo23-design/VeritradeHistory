const express = require('express');
const { getStats, incrementVisit } = require('../services/tradeService');
const { getDashboardStatus } = require('../services/syncService');

const router = express.Router();

router.get('/', async (req, res) => {
  const stats = await getStats();
  return res.json({ stats });
});

router.post('/visit', async (req, res) => {
  const stats = await incrementVisit();
  return res.json({ stats });
});

router.get('/dashboard', async (req, res) => {
  const [stats, dashboard] = await Promise.all([getStats(), getDashboardStatus()]);
  return res.json({ stats, dashboard });
});

module.exports = router;
