const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true, minlength: 6 },
  phone:     { type: String, default: '' },
  role:      { type: String, enum: ['user','admin'], default: 'user' },
  avatar:    { type: String, default: '' },
  addresses: [{
    label: String, fullName: String, phone: String,
    street: String, city: String, state: String, zipCode: String,
    isDefault: { type: Boolean, default: false }
  }],
  wishlist:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isActive:  { type: Boolean, default: true }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.matchPassword = async function(p) {
  return bcrypt.compare(p, this.password);
};

module.exports = mongoose.model('User', userSchema);
