const express = require('express');
const { Activity } = require('../models');

const router = express.Router();

router.get('/', async (req, res) => {
  const { page = 1, limit = 30, type = '' } = req.query;
  const query = {};
  if (type) query.type = type;
  const skip = (Math.max(parseInt(page, 10), 1) - 1) * parseInt(limit, 10);
  const [activities, total] = await Promise.all([
    Activity.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
    Activity.countDocuments(query)
  ]);
  return res.json({ activities, total });
});

module.exports = router;
