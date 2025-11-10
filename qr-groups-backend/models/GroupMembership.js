// models/GroupMembership.js
const mongoose = require('mongoose')

const membershipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  role: { type: String, enum: ['member', 'admin'], default: 'member' },
}, { timestamps: true })

// Prevent same user joining same group twice
membershipSchema.index({ user: 1, group: 1 }, { unique: true })

module.exports = mongoose.model('GroupMembership', membershipSchema)
