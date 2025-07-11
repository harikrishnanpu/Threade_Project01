const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const cartItemSchema = new Schema({
  product: {
    type: Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    size: {
      type: String,
      required: true,
      enum: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
    },
    color: {
      type: String,
      required: true
    }
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  image: String,
  name: String
}, { _id: false });

const cartSchema = new Schema({
  userId: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: {
    type: [cartItemSchema],
    default: []
  },
  coupon: {
    code: { type: String, default: null },
    discount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 }
  },
  subTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  grandTotal: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});


cartSchema.pre('save', function (next) {
  let sub = 0;

  this.items.forEach(item => {
    const basePrice = item.salePrice > 0 ? item.salePrice : item.price;
    item.total = basePrice * item.quantity;
    sub += item.total;
  });

  this.subTotal = sub;

  if (this.coupon && this.coupon.discount > 0) {
    const discountAmt = Math.round((sub * this.coupon.discount) / 100);
    this.coupon.discountAmount = discountAmt;
    this.grandTotal = sub - discountAmt;
  } else {
    this.coupon.discountAmount = 0;
    this.grandTotal = sub;
  }

  next();

});

module.exports = mongoose.model('Cart', cartSchema);
