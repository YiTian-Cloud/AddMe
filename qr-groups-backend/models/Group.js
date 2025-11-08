// models/Group.js
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// 👇 THIS creates the model
const Group = mongoose.model('Group', groupSchema);

// 👇 THIS is the important part: export the model itself, not an object wrapper
module.exports = Group;
