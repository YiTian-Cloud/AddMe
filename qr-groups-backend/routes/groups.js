// routes/groups.js
const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// helper to slugify a group name
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // spaces -> dashes
    .replace(/[^a-z0-9\-]/g, ''); // remove weird chars
}

// GET /groups  -> list all groups (public)
router.get('/', async (req, res) => {
  try {
    console.log('--- GET /groups called ---');
    console.log('Group model is:', typeof Group, Group && Group.modelName);

    const groups = await Group.find().sort({ name: 1 }).lean();
    console.log('Groups from DB:', groups);

    res.json({ groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch groups',
                           details: err.message,
         });
  }
});

// POST /groups  -> create new group & add current user to it (auth)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const slug = slugify(name);

    // avoid duplicates
    const existing = await Group.findOne({ slug });
    if (existing) {
      return res.status(400).json({ error: 'A group with this name already exists' });
    }

    const group = await Group.create({
      name,
      slug,
      description: description || '',
      createdBy: req.user._id,
    });

    // add group to user's groups
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { groups: group._id } },
      { new: true }
    );

    res.status(201).json({ group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// POST /groups/:groupId/join  -> current user joins a group (auth)
router.post('/:groupId/join', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { groups: group._id } },
      { new: true }
    );

    res.json({ message: 'Joined group', group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

module.exports = router;
