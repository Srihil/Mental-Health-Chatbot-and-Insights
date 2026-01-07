import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import upload from '../middleware/upload.js'; // ✅ add this import at top

const router = express.Router();

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// PUT /api/auth/profile/:id
router.put('/profile/:id', upload.single('avatar'), async (req, res) => {
  try {
    const { name, bio } = req.body;
    const avatar = req.file ? `/uploads/${req.file.filename}` : undefined;

    const update = {};
    if (name) update.name = name;
    if (bio) update.bio = bio;
    if (avatar) update.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ✅ Register User
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: username.toLowerCase(),
      email,
      password: hashedPassword,
      name: "",
      avatar: "",
      bio: "Hey, There I am using chat app",
      lastSeen: Date.now()
    });

    await Chat.create({ userId: user._id, chatsData: [] });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update last seen timestamp
router.put('/lastseen/:id', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { lastSeen: req.body.lastSeen });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Password Reset Simulation
router.post('/reset', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email not found' });
    // In production, send reset link via email (nodemailer)
    res.json({ message: 'Reset link (simulated)' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get user data from token
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});


export default router;
