const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempt: {
  type: Number,
  default: 0,
  validate: {
    validator: function (value) {
      return value <= 5;
    },
    message: 'Too many attempts',
  },
}

}, { timestamps: true });

module.exports = mongoose.model('Otp', otpSchema);
