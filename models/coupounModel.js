const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const couponSchema = new Schema({
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
    enum: ['all', 'newUsers', 'vipUsers'],
    default: 'all'
  },

  allowedUsers: [{
    type: Types.ObjectId,
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
    type: Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
