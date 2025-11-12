// routes/qr.js
const express = require('express')
const QRCode = require('qrcode')
const Group = require('../models/Group')

const router = express.Router()

const FRONTEND_BASE_URL = (process.env.FRONTEND_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

// Simple debug route: GET /qr/test
router.get('/test', (req, res) => {
    res.send('QR router is working');
  });
  


// Simple debug route: GET /qr/test
router.get('/test', (req, res) => {
  res.send('QR router is working')
})

// GET /qr/group/:id.png  -> returns a PNG QR image
router.get('/group/:id.png', async (req, res) => {
  try {
    const groupId = req.params.id

    const group = await Group.findById(groupId)
    if (!group) {
      return res.status(404).send('Group not found')
    }

   // const joinUrl = `http://localhost:4000/qr/join?groupId=${groupId}`
   const joinUrl = `${FRONTEND_BASE_URL}/join?groupId=${groupId}`;

    res.setHeader('Content-Type', 'image/png')

    QRCode.toFileStream(res, joinUrl, {
      width: 300,
      margin: 1,
    })
  } catch (err) {
    console.error(err)
    res.status(500).send('Failed to generate QR code')
  }
})

// GET /qr/join?groupId=...  -> returns group info JSON
router.get('/join', async (req, res) => {
  try {
    const { groupId } = req.query

    if (!groupId) {
      return res.status(400).json({ error: 'Missing groupId' })
    }

    const group = await Group.findById(groupId)
    if (!group) {
      return res.status(404).json({ error: 'Group not found' })
    }

    res.json({
      id: group._id,
      name: group.name,
      description: group.description,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
