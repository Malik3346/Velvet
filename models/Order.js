const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, unique: true },
  items: [{
    product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String, image: String, price: Number,
    quantity: Number, size: String, color: String
  }],
  shippingAddress: {
    fullName: String, phone: String, street: String,
    city: String, state: String, zipCode: String
  },
  paymentMethod:  { type: String, enum: ['Cash on Delivery','Online Payment'], default: 'Cash on Delivery' },
  paymentStatus:  { type: String, enum: ['Pending','Paid','Failed','Refunded'], default: 'Pending' },
  orderStatus:    { type: String, enum: ['Pending','Confirmed','Processing','Shipped','Delivered','Cancelled'], default: 'Pending' },
  subtotal:       { type: Number, required: true },
  shippingCost:   { type: Number, default: 150 },
  discount:       { type: Number, default: 0 },
  totalAmount:    { type: Number, required: true },
  notes:          { type: String, default: '' },
  deliveredAt:    { type: Date },
  cancelledAt:    { type: Date },
  cancelReason:   { type: String }
}, { timestamps: true });

orderSchema.pre('save', function(next) {
  if (!this.orderNumber) this.orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random()*1000);
  next();
});
module.exports = mongoose.model('Order', orderSchema);
