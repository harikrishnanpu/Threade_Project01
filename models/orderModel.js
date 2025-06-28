const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const orderItemSchema = new Schema({
  productId: {
    type: Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  brand: String,

  variant: {
    size: {
      type: String,
      enum: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
      required: true
    },
    color: { type: String, required: true }
  },

  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },

  status: {
    type: String,
    enum: [
      'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'return-requested', 'return-processing', 'return-pickup',
      'return-complete', 'return-rejected'
    ],
    default: 'pending'
  },

  isCancelled: { type: Boolean, default: false },
  cancelledAt: Date,
  cancelledBy: {
    type: String,
    enum: ['user', 'admin'],
    default: null
  },
  cancellationReason: String,

  returnReason: String,
  returnNote: String,
  returnRequestedAt: Date,
  returnProcessAt: Date,
  returnApprovedAt: Date,
  returnRejectedAt: Date,
  returnCompletedAt: Date,
  pickupScheduledAt: Date,
  pickupDate: Date,
  returnRequestedBy: {
    type: String,
    enum: ['user'],
    default: null
  }
});

const orderSchema = new Schema({
  orderNumber: {
  type: String,
  unique: true,
  required: true
  },
  user: {
    type: Types.ObjectId,
    ref: 'users',
    required: true
  },
  items: {
    type: [orderItemSchema],
    required: true
  },
  shippingAddress: {
    fullName:{ type: String, required: true },
    phone:{ type: String, required: true },
    street:{ type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: {type: String, required: true }
  },

  coupon: {
    code: String,
    discountAmount: Number
  },
  subtotal:    { type: Number, required: true },
  totalAmount: { type: Number, required: true },

  paymentMethod: {
    type: String,
    enum: ['cod', 'online'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },

  orderStatus: {
    type: String,
    enum: [
      'pending', 'confirmed', 'shipped', 'delivered', 'cancelled',
      'return-requested', 'return-processing', 'return-pickup',
      'return-complete', 'return-rejected', 'partial-return'
    ],
    default: 'pending'
  },

  paymentId: String,

  isDelivered: { type: Boolean, default: false },
  deliveredAt: Date,

  isCancelled: { type: Boolean, default: false },
  cancelledAt: Date,
  cancelledBy: {
    type: String,
    enum: ['user', 'admin'],
    default: null
  },
  cancellationReason: String,

  returnReason: String,
  returnNote: String,
  returnRequestedAt: Date,
  returnApprovedAt: Date,
  returnProcessAt: Date,
  returnRejectedAt: Date,
  returnCompletedAt: Date,

  pickupScheduledAt: Date,
  pickupDate: Date,
  returnRequestedBy: {
    type: String,
    enum: ['user'],
    default: null
  },

  trackingNumber: { type: String },
  isUrgent: { type: Boolean, default: false },
  userNotes: { type: String},
  adminNotes: { type:  String },


  timeline: [
  {
    status: {
      type: String,
      enum: ['placed', 'paid' , 'pending' , 'confirmed', 'shipped', 'delivered', 'cancelled','return-requested' , 'return-processing', 'return-pickup', 'return-complete', 'return-rejected' ],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    note: String
  }
]

}, { timestamps: true });


const Orders = mongoose.model('Order', orderSchema);
module.exports = Orders;


