const express = require('express');
const { getCachedData, syncFromProvider, getItemsFromDb, getValueChangesFromDb } = require('../services/neblioService');

const router = express.Router();

router.get('/', async (req, res) => {
  const data = getCachedData();
  const [items, valueChanges] = await Promise.all([getItemsFromDb(), getValueChangesFromDb()]);
  return res.json({ ...data, items, valueChangesFromDb: valueChanges });
});

router.post('/sync', async (req, res) => {
  const result = await syncFromProvider();
  return res.json(result);
});

module.exports = router;
