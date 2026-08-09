const express = require('express');
const { Middleman } = require('../models');

const router = express.Router();

router.get('/', async (req, res) => {
  const middlemen = await Middleman.find({ active: true }).sort({ sortOrder: 1, name: 1 });
  return res.json({ middlemen });
});

router.get('/:slug', async (req, res) => {
  const middleman = await Middleman.findOne({ slug: req.params.slug, active: true });
  if (!middleman) return res.status(404).json({ error: 'Middleman not found' });
  return res.json({ middleman });
});

module.exports = router;
