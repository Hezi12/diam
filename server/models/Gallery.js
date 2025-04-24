const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
    enum: ['airport', 'rothschild']
  },
  imageUrl: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema); 