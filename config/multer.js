const multer = require('multer');

// Configure multer to store files in memory
const storage = multer.memoryStorage();

// File filter for images
const imageFilter = (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
            cb(null, true);
      } else {
            cb(new Error('Only image files are allowed!'), false);
      }
};

// File filter for all media types
const mediaFilter = (req, file, cb) => {
      const allowedTypes = ['image/', 'video/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats'];

      if (allowedTypes.some(type => file.mimetype.startsWith(type) || file.mimetype.includes(type))) {
            cb(null, true);
      } else {
            cb(new Error('File type not supported!'), false);
      }
};

// Upload configurations
const uploadImage = multer({
      storage: storage,
      limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: imageFilter
});

const uploadMedia = multer({
      storage: storage,
      limits: {
            fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: mediaFilter
});

module.exports = {
      uploadImage,
      uploadMedia
};
