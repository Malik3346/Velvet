const router = require('express').Router();
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try { res.json(await Category.find({ isActive: true })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});
router.get('/all', protect, admin, async (req, res) => {
  try { res.json(await Category.find()); }
  catch (e) { res.status(500).json({ message: e.message }); }
});
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, description, image, icon } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    res.status(201).json(await Category.create({ name, slug, description, image, icon }));
  } catch (e) { res.status(400).json({ message: e.message }); }
});
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.name) data.slug = data.name.toLowerCase().replace(/\s+/g, '-');
    const cat = await Category.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!cat) return res.status(404).json({ message: 'Not found' });
    res.json(cat);
  } catch (e) { res.status(400).json({ message: e.message }); }
});
router.delete('/:id', protect, admin, async (req, res) => {
  try { await Category.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
