const router = require('express').Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/auth');

router.get('/stats', protect, admin, async (req, res) => {
  try {
    const [totalUsers, totalProducts, orders] = await Promise.all([User.countDocuments({ role:'user' }), Product.countDocuments({ isActive:true }), Order.find().populate('user','name')]);
    const totalRevenue = orders.filter(o => o.orderStatus !== 'Cancelled').reduce((s, o) => s + o.totalAmount, 0);
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const rev = orders.filter(o => { const od = new Date(o.createdAt); return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear() && o.orderStatus !== 'Cancelled'; }).reduce((s,o) => s + o.totalAmount, 0);
      monthly.push({ month: d.toLocaleString('default',{month:'short'}), revenue: rev });
    }
    res.json({ totalUsers, totalProducts, totalOrders: orders.length, totalRevenue, pendingOrders: orders.filter(o=>o.orderStatus==='Pending').length, deliveredOrders: orders.filter(o=>o.orderStatus==='Delivered').length, cancelledOrders: orders.filter(o=>o.orderStatus==='Cancelled').length, monthly });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/users', protect, admin, async (req, res) => {
  try { res.json(await User.find().select('-password').sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/users/:id/toggle', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    user.isActive = !user.isActive; await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
