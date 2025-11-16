const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Check if we're in a serverless environment (Vercel, etc.)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || !fs.existsSync || typeof fs.mkdirSync === 'undefined';

// Only create directories if not in serverless environment
if (!isServerless) {
  // Create upload directories if they don't exist
  const uploadDir = path.join(__dirname, '../../uploads');
  const avatarsDir = path.join(uploadDir, 'avatars');
  const thumbnailsDir = path.join(uploadDir, 'thumbnails');

  [uploadDir, avatarsDir, thumbnailsDir].forEach((dir) => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (error) {
      console.warn(`Could not create directory ${dir}:`, error.message);
    }
  });
}

// For serverless, use memory storage (files will need to be uploaded to external storage)
const storage = isServerless 
  ? multer.memoryStorage() // Use memory storage in serverless
  : multer.diskStorage({
      destination: (req, file, cb) => {
        if (file.fieldname === 'avatar') {
          cb(null, path.join(__dirname, '../../uploads/avatars'));
        } else if (file.fieldname === 'thumbnail') {
          cb(null, path.join(__dirname, '../../uploads/thumbnails'));
        } else {
          cb(null, path.join(__dirname, '../../uploads'));
        }
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      },
    });

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
  },
  fileFilter,
});

module.exports = { upload };
