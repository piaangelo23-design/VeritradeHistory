const express = require('express');
const { getMembers } = require('../services/memberService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const members = await getMembers();
    return res.json({ members, total: members.length });
  } catch (error) {
    console.error('[Members API]', error);
    return res.status(500).json({ error: 'Failed to fetch Discord members' });
  }
});

module.exports = router;