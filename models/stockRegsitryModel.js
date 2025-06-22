const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const stockRegistrySchema = new Schema(
  {
    productId:   { type: Types.ObjectId, ref: 'Product', required: true },
    variantId:   { type: Types.ObjectId, default: null },        
    productName: { type: String, required: true },
    action:      { type: String, enum: ['stock_in', 'stock_out'], required: true },
    quantity:    { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock:{ type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    updatedBy:   { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockRegistry', stockRegistrySchema);
