const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  description:   { type: String, required: true },
  price:         { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: 0 },
  category:      { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand:         { type: String, default: '' },
  images:        [{ type: String }],
  sizes:         [{ type: String }],
  colors:        [{ type: String }],
  stock:         { type: Number, required: true, default: 0 },
  sold:          { type: Number, default: 0 },
  rating:        { type: Number, default: 0 },
  numReviews:    { type: Number, default: 0 },
  tags:          [{ type: String }],
  isFeatured:    { type: Boolean, default: false },
  isNew:         { type: Boolean, default: true },
  isActive:      { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model('Product', productSchema);
