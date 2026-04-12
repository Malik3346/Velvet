const router = require('express').Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => res.json(await User.findById(req.user._id).select('-password').populate('wishlist','name price discountPrice images rating')));

router.put('/', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { name: req.body.name, phone: req.body.phone }, { new: true }).select('-password');
    res.json(user);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/password', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(req.body.currentPassword))) return res.status(400).json({ message: 'Wrong current password' });
    user.password = req.body.newPassword; await user.save();
    res.json({ message: 'Password updated' });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.post('/address', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (req.body.isDefault) user.addresses.forEach(a => a.isDefault = false);
    user.addresses.push(req.body); await user.save();
    res.json(user.addresses);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/address/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses.pull(req.params.id); await user.save();
    res.json(user.addresses);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/wishlist/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const idx = user.wishlist.indexOf(req.params.productId);
    if (idx > -1) user.wishlist.splice(idx, 1); else user.wishlist.push(req.params.productId);
    await user.save(); res.json({ wishlist: user.wishlist });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
