const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { requireAdmin } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const {
  Trade, Middleman, Item, ValueChange, Activity, Settings, WebsiteStats, SyncLog
} = require('../models');
const {
  createVerifiedTrade, recalculateStats, getSettings, getStats
} = require('../services/tradeService');
const { getDashboardStatus, logSync } = require('../services/syncService');
const { syncFromProvider } = require('../services/neblioService');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.post('/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  const validPassword = config.adminPasswordHash && typeof password === 'string'
    ? await bcrypt.compare(password, config.adminPasswordHash)
    : false;
  if (username !== config.adminUsername || !validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ admin: true, username }, config.jwtSecret, { expiresIn: '12h' });
  return res.json({ token });
});

router.get('/dashboard', requireAdmin, async (req, res) => {
  const [stats, dashboard, settings] = await Promise.all([
    getStats(), getDashboardStatus(), getSettings()
  ]);
  return res.json({ stats, dashboard, settings });
});

router.get('/logs', requireAdmin, async (req, res) => {
  const logs = await SyncLog.find().sort({ createdAt: -1 }).limit(100);
  return res.json({ logs });
});

router.put('/settings', requireAdmin, async (req, res) => {
  const settings = await getSettings();
  const allowed = [
    'tradeChannelId', 'guildId', 'trackingEnabled', 'syncInterval',
    'smallTradeMax', 'mediumTradeMax', 'tradeParser', 'announcements'
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) settings[key] = req.body[key];
  }
  settings.updatedAt = new Date();
  await settings.save();
  await logSync('Admin updated settings', { type: 'system', admin: req.admin.username });
  return res.json({ settings });
});

router.post('/trades', requireAdmin, async (req, res) => {
  const payload = { ...req.body, source: 'admin', verified: true, isTest: Boolean(req.body.isTest) };
  const result = await createVerifiedTrade(payload);
  return res.status(result.duplicate ? 200 : 201).json(result);
});

router.put('/trades/:id', requireAdmin, async (req, res) => {
  const trade = await Trade.findOneAndUpdate(
    { $or: [{ tradeId: req.params.id }, { _id: req.params.id }] },
    { ...req.body, updatedAt: new Date() },
    { new: true }
  );
  if (!trade) return res.status(404).json({ error: 'Not found' });
  await recalculateStats();
  return res.json({ trade });
});

router.delete('/trades/:id', requireAdmin, async (req, res) => {
  await Trade.findOneAndDelete({ $or: [{ tradeId: req.params.id }, { _id: req.params.id }] });
  await recalculateStats();
  return res.json({ success: true });
});

router.post('/middlemen', requireAdmin, async (req, res) => {
  const middleman = await Middleman.create(req.body);
  await recalculateStats();
  return res.status(201).json({ middleman });
});

router.put('/middlemen/:id', requireAdmin, async (req, res) => {
  const middleman = await Middleman.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
  if (!middleman) return res.status(404).json({ error: 'Not found' });
  await recalculateStats();
  return res.json({ middleman });
});

router.delete('/middlemen/:id', requireAdmin, async (req, res) => {
  await Middleman.findByIdAndDelete(req.params.id);
  await recalculateStats();
  return res.json({ success: true });
});

router.post('/items', requireAdmin, async (req, res) => {
  const item = await Item.create(req.body);
  const stats = await getStats();
  stats.newItems += 1;
  await stats.save();
  await Activity.create({ type: 'new_item', title: 'New item added', message: item.name, metadata: { itemId: item._id } });
  return res.status(201).json({ item });
});

router.put('/items/:id', requireAdmin, async (req, res) => {
  const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
  return res.json({ item });
});

router.delete('/items/:id', requireAdmin, async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  return res.json({ success: true });
});

router.post('/vouches', requireAdmin, async (req, res) => {
  const { middlemanId, count } = req.body;
  const middleman = await Middleman.findById(middlemanId);
  if (!middleman) return res.status(404).json({ error: 'Middleman not found' });
  middleman.vouches = Math.max(0, Number(count));
  await middleman.save();
  await recalculateStats();
  await Activity.create({ type: 'vouch', title: 'Vouches updated', message: `${middleman.name}: ${middleman.vouches} vouches`, metadata: { middlemanId } });
  return res.json({ middleman });
});

router.post('/announcements', requireAdmin, async (req, res) => {
  const settings = await getSettings();
  settings.announcements.unshift({ ...req.body, createdAt: new Date() });
  await settings.save();
  await Activity.create({ type: 'announcement', title: req.body.title, message: req.body.message });
  return res.json({ announcements: settings.announcements });
});

router.post('/refresh', requireAdmin, async (req, res) => {
  const stats = await recalculateStats();
  const neblio = await syncFromProvider();
  return res.json({ stats, neblio });
});

router.post('/test-trade', requireAdmin, async (req, res) => {
  const result = await createVerifiedTrade({
    tradeId: uuidv4(),
    buyer: 'TestBuyer',
    seller: 'TestSeller',
    buyerItem: 'Test Item A',
    sellerItem: 'Test Item B',
    value: 100,
    middleman: null,
    status: 'Completed',
    isTest: true,
    source: 'admin-test'
  });
  return res.json(result);
});

module.exports = router;
