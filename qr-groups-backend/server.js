// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const postRoutes = require('./routes/posts');
const qrRoutes = require('./routes/qr');

const app = express();

// ✅ CORS configuration — allow Vercel + local dev
const allowedOrigins = [
  'https://add-me-azure.vercel.app',
  'http://localhost:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn('❌ Blocked by CORS:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // set true only if you use cookies
}));

// Handle preflight requests explicitly
app.options(/.*/, cors());

// 🧹 Trim accidental %0A from URL (Postman newline safety)
app.use((req, res, next) => {app.options(/.*/, cors());
  if (req.url.endsWith('%0A')) {
    console.log('🧹 Trimming %0A from URL:', req.url);
    req.url = req.url.slice(0, -3);
  }
  next();
});

// 🔍 Simple request logger
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🩺 Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// ✅ Your routes
app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/', postRoutes);
app.use('/qr', qrRoutes);

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ Mongo connection error:', err);
  });
