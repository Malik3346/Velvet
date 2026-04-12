const router = require('express').Router();
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, size, featured, isNew, page = 1, limit = 12 } = req.query;
    let q = { isActive: true };
    if (category) q.category = category;
    if (search) q.$or = [{ name: { $regex: search, $options: 'i' } }, { brand: { $regex: search, $options: 'i' } }];
    if (minPrice || maxPrice) { q.price = {}; if (minPrice) q.price.$gte = +minPrice; if (maxPrice) q.price.$lte = +maxPrice; }
    if (size) q.sizes = size;
    if (featured === 'true') q.isFeatured = true;
    if (isNew === 'true') q.isNew = true;
    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { price: 1 };
    else if (sort === 'price_desc') sortObj = { price: -1 };
    else if (sort === 'rating') sortObj = { rating: -1 };
    else if (sort === 'popular') sortObj = { sold: -1 };
    const total = await Product.countDocuments(q);
    const products = await Product.find(q).populate('category', 'name slug').sort(sortObj).limit(+limit).skip((+page - 1) * +limit);
    res.json({ products, total, page: +page, pages: Math.ceil(total / +limit) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', protect, admin, upload.array('images', 5), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files?.length) data.images = req.files.map(f => `/uploads/${f.filename}`);
    if (typeof data.sizes === 'string') data.sizes = JSON.parse(data.sizes);
    if (typeof data.colors === 'string') data.colors = JSON.parse(data.colors);
    res.status(201).json(await Product.create(data));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/:id', protect, admin, upload.array('images', 5), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files?.length) data.images = req.files.map(f => `/uploads/${f.filename}`);
    if (typeof data.sizes === 'string') data.sizes = JSON.parse(data.sizes);
    if (typeof data.colors === 'string') data.colors = JSON.parse(data.colors);
    const p = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try { await Product.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
