import express from 'express';
import User from '../models/User.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// GET /api/user/search?username=xyz
router.get('/search', verifyToken, async (req, res) => {
  try {
    const username = req.query.username?.toLowerCase();
    if (!username) return res.status(400).json({ message: 'Username query is required' });

    const user = await User.findOne({
      $or: [{ username: username }, { email: username }],
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
});

// GET bot user
router.get('/bot', verifyToken, async (req, res) => {
  const bot = await User.findOne({ email: 'bot@mindease.ai' });
  if (!bot) return res.status(404).json({ message: 'Bot not found' });
  res.json(bot);
});

// GET user by ID (keep last)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
