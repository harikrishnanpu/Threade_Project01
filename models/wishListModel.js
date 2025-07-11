const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const wishlistItemSchema = new Schema({
  product: {
    type: Types.ObjectId,
    ref: 'Product',
    required: true
  },
variant: {
    size: { type: String, default: null},
    color: { type: String, default: null}
  },
}, { _id: false });

const wishlistSchema = new Schema({
  user: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [wishlistItemSchema]
}, { timestamps: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist;
