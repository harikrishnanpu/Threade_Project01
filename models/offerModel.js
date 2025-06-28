const mongoose = require('mongoose');
const { Schema } = mongoose;

const offerSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  image: { type: String },
  discount: {
    type: Number,
    required: true,
    min: 1
  },
  maxDiscountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  applicableOn: {
    type: String,
    enum: ['product', 'category'],
    required: true
  },
  products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'users' }

}, {
  timestamps: true
});

module.exports = mongoose.model('Offer', offerSchema);
