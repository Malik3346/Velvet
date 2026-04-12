// reviews.js
const router = require('express').Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

router.get('/:productId', async (req, res) => {
  try { res.json(await Review.find({ product: req.params.productId }).populate('user','name avatar').sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const { product, rating, comment } = req.body;
    if (await Review.findOne({ user: req.user._id, product })) return res.status(400).json({ message: 'Already reviewed' });
    const review = await Review.create({ user: req.user._id, product, rating, comment });
    const reviews = await Review.find({ product });
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(product, { rating: avg.toFixed(1), numReviews: reviews.length });
    await review.populate('user', 'name avatar');
    res.status(201).json(review);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Not found' });
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
