const router = require('express').Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const calc = (items) => items.reduce((s, i) => s + i.price * i.quantity, 0);

router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name images price stock isActive');
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [], totalAmount: 0 });
    res.json(cart);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/add', protect, async (req, res) => {
  try {
    const { productId, quantity = 1, size = '', color = '' } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ message: 'Insufficient stock' });
    let cart = await Cart.findOne({ user: req.user._id }) || new Cart({ user: req.user._id, items: [] });
    const price = product.discountPrice > 0 ? product.discountPrice : product.price;
    const idx = cart.items.findIndex(i => i.product.toString() === productId && i.size === size && i.color === color);
    if (idx > -1) cart.items[idx].quantity += quantity;
    else cart.items.push({ product: productId, quantity, size, color, price });
    cart.totalAmount = calc(cart.items);
    await cart.save();
    await cart.populate('items.product', 'name images price stock');
    res.json(cart);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/update/:itemId', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (req.body.quantity <= 0) cart.items.pull(req.params.itemId);
    else item.quantity = req.body.quantity;
    cart.totalAmount = calc(cart.items);
    await cart.save();
    await cart.populate('items.product', 'name images price stock');
    res.json(cart);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/remove/:itemId', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    cart.items.pull(req.params.itemId);
    cart.totalAmount = calc(cart.items);
    await cart.save();
    await cart.populate('items.product', 'name images price stock');
    res.json(cart);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/clear', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) { cart.items = []; cart.totalAmount = 0; await cart.save(); }
    res.json({ message: 'Cart cleared' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
