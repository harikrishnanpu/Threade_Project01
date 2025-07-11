const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  
  name: {
    type: String,
    required: [true, 'category name is required'],
    unique: [true, 'catgeory name is already exits' ],
    trim: true
  },
  
  description: {
    type: String,
    trim: true,
  },
  
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }
}, {
  timestamps: true 
});



const Category = mongoose.model('Category', categorySchema);
module.exports = Category;