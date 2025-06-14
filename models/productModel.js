const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VariantSchema = new Schema({
  size: {
    type: String,
    enum: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
    required: true
  },
  color: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    min: 0,
    default: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    min: 0,
    default: 0
  },
  images: {
    type: [String],
    validate: [array => array.length >= 3, 'At least 3 image is required for each variant.']
  }
});

const ProductSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand'
  },
  variants: {
    type: [VariantSchema],
    validate: [arr => arr.length > 0, 'At least one variant is required.']
  },
  tags: {
    type: [String],
    enum: ['deal-of-the-day', 'top-seller', 'new-arrival'],
    default: []
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  }
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);
module.exports = Product;
