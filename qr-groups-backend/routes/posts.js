// routes/posts.js
const express = require('express')
const auth = require('../middleware/auth')
const Post = require('../models/Post')
const GroupMembership = require('../models/GroupMembership')

const router = express.Router()

// Get posts in a group: GET /groups/:groupId/posts
router.get('/groups/:groupId/posts', auth, async (req, res) => {
  try {
    const { groupId } = req.params

    // Ensure user is a member
    const membership = await GroupMembership.findOne({
      group: groupId,
      user: req.user._id,
    })

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' })
    }

    const posts = await Post.find({ group: groupId })
      .populate('author', 'name')
      .sort({ createdAt: -1 })

    res.json(posts)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Create a post in a group: POST /groups/:groupId/posts
router.post('/groups/:groupId/posts', auth, async (req, res) => {
  try {
    const { groupId } = req.params
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ error: 'Content is required' })
    }

    const membership = await GroupMembership.findOne({
      group: groupId,
      user: req.user._id,
    })

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' })
    }

    const post = await Post.create({
      group: groupId,
      author: req.user._id,
      content,
    })

    res.json(post)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
