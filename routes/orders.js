const router = require('express').Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = 'Cash on Delivery', notes } = req.body;
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart?.items.length) return res.status(400).json({ message: 'Cart is empty' });
    const items = cart.items.map(i => ({ product: i.product._id, name: i.product.name, image: i.product.images?.[0] || '', price: i.price, quantity: i.quantity, size: i.size, color: i.color }));
    const subtotal = cart.totalAmount;
    const shippingCost = subtotal >= 3000 ? 0 : 150;
    const order = await Order.create({ user: req.user._id, items, shippingAddress, paymentMethod, subtotal, shippingCost, totalAmount: subtotal + shippingCost, notes });
    for (const item of cart.items) await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity, sold: item.quantity } });
    cart.items = []; cart.totalAmount = 0; await cart.save();
    res.status(201).json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/my', protect, async (req, res) => {
  try { res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Not found' });
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Not found' });
    if (order.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Access denied' });
    if (!['Pending','Confirmed'].includes(order.orderStatus)) return res.status(400).json({ message: 'Cannot cancel now' });
    order.orderStatus = 'Cancelled'; order.cancelledAt = new Date(); order.cancelReason = req.body.reason || 'Cancelled by user';
    await order.save(); res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin routes
router.get('/', protect, admin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let q = {}; if (status) q.orderStatus = status;
    const total = await Order.countDocuments(q);
    const orders = await Order.find(q).populate('user', 'name email').sort({ createdAt: -1 }).limit(+limit).skip((+page-1)*+limit);
    res.json({ orders, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Not found' });
    if (req.body.orderStatus) order.orderStatus = req.body.orderStatus;
    if (req.body.paymentStatus) order.paymentStatus = req.body.paymentStatus;
    if (req.body.orderStatus === 'Delivered') order.deliveredAt = new Date();
    await order.save(); res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
