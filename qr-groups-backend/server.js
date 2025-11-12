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

const allowedProd = new Set([
  'https://add-me-azure.vercel.app', // production
]);

function isAllowedOrigin(origin) {
  if (!origin) return true; // Postman/cURL/mobile apps
  try {
    const { origin: parsedOrigin, hostname, protocol } = new URL(origin);
    if (allowedProd.has(parsedOrigin)) return true;
    // Allow any Vercel preview for this project
    if (protocol === 'https:' && hostname.endsWith('.vercel.app')) return true;
  } catch (e) {
    return false;
  }
  return false;
}

app.use(cors({
  origin(origin, cb) {
    return isAllowedOrigin(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false, // you’re not using cookies
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
