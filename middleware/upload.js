const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, '../uploads');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g,'-')}`)
});

const fileFilter = (req, file, cb) => {
  /jpeg|jpg|png|webp/.test(file.mimetype) ? cb(null, true) : cb(new Error('Images only'));
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
