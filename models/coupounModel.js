const mongoose = require('mongoose');


const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discount: { 
    type: Number,
    required: true,
    min: 1,
    max: 100 
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: Date,
  onlyFor: {
    type: String,
    enum: ['all', 'newUsers', 'premiumUsers'],
    default: 'all'
  },
  allowedUsers: [{
    type: mongoose.Types.ObjectId,
    ref: 'User'
  }],
  maxUsage: {
    type: Number,
    default: 1
  },
  usedCount: {
    type: Number,
    default: 0
  },
  usedBy: [{
    type: mongoose.Types.ObjectId,
    ref: 'User'
  }],
  minOrderAmount: {
    type: Number,
    default: 0, 
    min: 0
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
