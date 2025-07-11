const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Banner name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },

  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  page: {
    type: String,
    required: [true, 'Page is required'],
    trim: true,
    maxlength: [100, 'Page name too long'],
    enum: ['home', 'about', 'products', 'contact']
  },

  image: {
    type: String,
    required: [true, 'Banner image URL is required'],
    trim: true
  },

  buttonText: {
    type: String,
    trim: true,
    maxlength: [50, 'Button text cannot exceed 50 characters']
  },

  buttonLink: {
    type: String,
    trim: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  isListed: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Banner', bannerSchema);
