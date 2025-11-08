// routes/auth.js
const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const authMiddleware = require('../middleware/auth') 
const router = express.Router()

// POST /auth/signup
router.post('/signup', async (req, res) => {
  try {
    console.log('--- /auth/signup (REAL HANDLER) ---')
    console.log('Body:', req.body)

    const { email, name, password } = req.body

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' })
    }

    const passwordHash = await User.hashPassword(password)

    const user = await User.create({ email, name, passwordHash })

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /auth/login (unchanged)
router.post('/login', async (req, res) => {
  try {

    console.log('--- /auth/login ---');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body received:', req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Request body is empty. Did you send JSON with Content-Type: application/json?',
      });
    }
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    const valid = await user.checkPassword(password)
    if (!valid) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /auth/me  (protected)
router.get('/me', authMiddleware, async (req, res) => {
    // authMiddleware set req.user
    res.json({ user: req.user });
  });

module.exports = router
