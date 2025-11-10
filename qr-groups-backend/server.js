// server.js
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const groupRoutes = require('./routes/groups');
const postRoutes = require('./routes/posts')

const app = express()


const corsOptions = {
    origin: ['http://localhost:3000'], // add others if needed
    credentials: true,
  };
  
  app.use(cors(corsOptions));

  
// 🧹 Trim accidental %0A from end of URL (Postman newline safety)
app.use((req, res, next) => {
  if (req.url.endsWith('%0A')) {
    console.log('🧹 Trimming %0A from URL:', req.url)
    req.url = req.url.slice(0, -3) // remove '%0A'
  }
  next()
})

// 🔍 Simple request logger
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`)
  next()
})

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok' })
})

// ✅ Use your real auth routes
app.use('/auth', authRoutes)
app.use('/groups', groupRoutes)
app.use('/', postRoutes)


const PORT = process.env.PORT || 4000

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch(err => {
    console.error('Mongo connection error:', err)
  })
