const mongoose = require('mongoose');
const { Schema } = mongoose;

const VariantSchema = new Schema({
  size: {
    type: String,
    enum: ['xs','sm','md','lg','xl','xxl'],
    required: true
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    default: 0,
    min: 0
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: { type: Boolean, default: true },
  images: {
    type: [String],
    validate: {
      validator: arr => arr.length >= 3,
      message: 'At least 3 images are required per variant'
    }
  }
});

const ProductSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 2000 },
  category:{ type: Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: Schema.Types.ObjectId, ref: 'Brand', default: null },
  images:[{ type: String, }],
  stock: {
    type: Number,
    default: 0
  },
  regularPrice: { 
    type: Number, 
    min: 0,
    default: 0
  },
  salePrice: {
    type: Number,
    min: 0,
    default: 0
  },

  variants: {
    type: [VariantSchema],
    validate: {
      validator: arr => arr.length > 0,
      message: 'At least one variant is required.'
    }
  },

  

  tags:  { type: [String], enum: ['deal-of-the-day','top-seller','new-arrival'], default: [] },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  maxCartQuantity: {type: Number, default: 5 },
  isFeatured: { type: Boolean, default: false },



  isActive: { type: Boolean, default: true },
  isCategoryActive: { type: Boolean, default: true },
  isBrandActive: { type: Boolean, default: true },



  createdBy: { type: Schema.Types.ObjectId, ref: 'users' }
}, { timestamps: true , toJSON: { virtuals: true }});


ProductSchema.virtual('discountPercentage').get(function () {
  if (!this.regularPrice || !this.salePrice || this.salePrice >= this.regularPrice)
    return 0;
  return Math.round(((this.regularPrice - this.salePrice) / this.regularPrice) * 100);
});



ProductSchema.pre('save', function(next) {
  
  if (this.variants && this.variants.length) {
    const prices = this.variants.map(v => v.price).filter(p => p > 0);
    const stockArr = this.variants.map(v => v.stock);
    const salePrices = this.variants.map(v => v.salePrice).filter(sp => sp > 0);

    this.regularPrice = Math.max(...prices);
    this.stock = Math.min(...stockArr);

    this.salePrice = salePrices.length
      ? Math.min(...salePrices).toFixed(2)
      : 0;
  } else {
    this.regularPrice = 0;
    this.salePrice   = 0;
  }

  if (this.size) this.size = this.size.toLowerCase();
  if (this.color) this.color = this.color.toLowerCase();

  next();

});

module.exports = mongoose.model('Product', ProductSchema);
