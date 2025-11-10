// models/Group.js
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    slug: {
      type: String,
      unique: true, // uses existing slug_1 index
    },
  },
  { timestamps: true }
);

// Helper to make a slug from name
function makeSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanum -> -
    .replace(/(^-|-$)+/g, '');   // trim - at ends
}

// Auto-generate slug if missing
groupSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = makeSlug(this.name);
  }
  next();
});

module.exports = mongoose.model('Group', groupSchema);
