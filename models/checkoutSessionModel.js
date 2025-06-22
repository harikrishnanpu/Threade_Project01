const mongoose = require('mongoose');

const checkoutSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'users', required: true, unique: true },
  addressId: {type: String,  required: true},
  shippingMethod: {type: String, enum: ['free','regular','express'] , required: true},
  couponCode: {type: String,  default: null}
},{ timestamps: true });

const CheckoutSession = mongoose.model('CheckoutSession', checkoutSessionSchema);

module.exports = CheckoutSession;
