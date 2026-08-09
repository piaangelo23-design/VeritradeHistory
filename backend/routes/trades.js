const express = require('express');
const { Trade } = require('../models');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sort = 'completedAt',
      order = 'desc',
      tradeSize = '',
      middleman = '',
      status = '',
      verified = '',
      dateFrom = '',
      dateTo = '',
      includeTest = 'false'
    } = req.query;

    const query = {};
    if (includeTest !== 'true') query.isTest = false;

    if (search) {
      query.$or = [
        { buyer: new RegExp(search, 'i') },
        { seller: new RegExp(search, 'i') },
        { buyerItem: new RegExp(search, 'i') },
        { sellerItem: new RegExp(search, 'i') },
        { middleman: new RegExp(search, 'i') }
      ];
    }
    if (tradeSize) query.tradeSize = tradeSize;
    if (middleman === 'none') query.middleman = null;
    else if (middleman) query.middleman = new RegExp(middleman, 'i');
    if (status) query.status = new RegExp(status, 'i');
    if (verified === 'true') query.verified = true;
    if (verified === 'false') query.verified = false;

    if (dateFrom || dateTo) {
      query.completedAt = {};
      if (dateFrom) query.completedAt.$gte = new Date(dateFrom);
      if (dateTo) query.completedAt.$lte = new Date(dateTo);
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const allowedSort = ['completedAt', 'value', 'buyer', 'seller', 'tradeSize'];
    const sortField = allowedSort.includes(sort) ? sort : 'completedAt';

    const skip = (Math.max(parseInt(page, 10), 1) - 1) * parseInt(limit, 10);
    const [trades, total] = await Promise.all([
      Trade.find(query).sort({ [sortField]: sortOrder }).skip(skip).limit(parseInt(limit, 10)),
      Trade.countDocuments(query)
    ]);

    return res.json({
      trades,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('[Trades API]', error);
    return res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

router.get('/latest', async (req, res) => {
  const trade = await Trade.findOne({ isTest: false, verified: true }).sort({ completedAt: -1 });
  return res.json({ trade });
});

router.get('/:id', async (req, res) => {
  const trade = await Trade.findOne({ $or: [{ tradeId: req.params.id }, { _id: req.params.id }] });
  if (!trade) return res.status(404).json({ error: 'Trade not found' });
  return res.json({ trade });
});

module.exports = router;
