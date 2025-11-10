// routes/groups.js
const express = require('express');
const Group = require('../models/Group');
const GroupMembership = require('../models/GroupMembership');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a group: POST /groups
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const group = await Group.create({
      name,
      description,
      owner: req.user._id,
    });

    // Make creator an admin member
    await GroupMembership.create({
      user: req.user._id,
      group: group._id,
      role: 'admin',
    });

    res.json(group);
  } catch (err) {
    console.error(err);
    // handle duplicate slug (same name twice)
    if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
      return res
        .status(400)
        .json({ error: 'A group with this name already exists.' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Get my groups: GET /groups/mine
router.get('/mine', auth, async (req, res) => {
  try {
    const memberships = await GroupMembership
      .find({ user: req.user._id })
      .populate('group');

    const groups = memberships
      .map((m) => m.group)
      .filter(Boolean); // in case of dangling refs

    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all groups: GET /groups
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join a group: POST /groups/:id/join
router.post('/:id/join', auth, async (req, res) => {
  try {
    const groupId = req.params.id;

    const existing = await GroupMembership.findOne({
      user: req.user._id,
      group: groupId,
    });

    if (existing) {
      return res.json({ status: 'already_member' });
    }

    await GroupMembership.create({
      user: req.user._id,
      group: groupId,
      role: 'member',
    });

    res.json({ status: 'joined' });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.json({ status: 'already_member' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
