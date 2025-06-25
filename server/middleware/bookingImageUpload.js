const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

// נתיב uploads מותאם לסביבה
const getUploadsPath = () => {
  return process.env.NODE_ENV === 'production' 
    ? '/opt/render/project/src/uploads'
    : path.join(__dirname, '../uploads');
};

// הגדרת אחסון עם multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const location = req.body.location || 'airport';
      const uploadPath = path.join(getUploadsPath(), 'bookings', location);
      
      // יצירת התיקייה אם לא קיימת
      await fs.ensureDir(uploadPath);
      
      cb(null, uploadPath);
    } catch (error) {
      console.error('שגיאה ביצירת תיקיית העלאה:', error);
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    // יצירת שם קובץ ייחודי
    const timestamp = Date.now();
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `${timestamp}-${uniqueId}${extension}`;
    
    cb(null, filename);
  }
});

// פילטר לבדיקת סוגי קבצים מותרים
const fileFilter = (req, file, cb) => {
  console.log('🔍 בדיקת קובץ:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  // סוגי קבצים מותרים
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/pdf'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`סוג קובץ לא נתמך: ${file.mimetype}. סוגים מותרים: JPG, PNG, GIF, PDF`);
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// הגדרת multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB מקסימום
    files: 2 // מקסימום 2 קבצים
  }
});

// Middleware לטיפול בשגיאות העלאה
const handleUploadErrors = (error, req, res, next) => {
  console.error('🚨 שגיאה בהעלאת קבצים:', error);

  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'הקובץ גדול מדי. גודל מקסימלי: 5MB'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'ניתן להעלות מקסימום 2 קבצים'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'שדה קובץ לא צפוי'
        });
      default:
        return res.status(400).json({
          error: `שגיאה בהעלאת קובץ: ${error.message}`
        });
    }
  }

  if (error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      error: error.message
    });
  }

  // שגיאה כללית
  return res.status(500).json({
    error: 'שגיאה פנימית בהעלאת קובץ'
  });
};

// פונקציה למחיקת קבצים
const deleteBookingImages = async (images) => {
  if (!images || !Array.isArray(images)) {
    return;
  }

  for (const image of images) {
    try {
      if (image.path && await fs.pathExists(image.path)) {
        await fs.remove(image.path);
        console.log(`✅ קובץ נמחק: ${image.filename}`);
      }
    } catch (error) {
      console.error(`❌ שגיאה במחיקת קובץ ${image.filename}:`, error);
    }
  }
};

module.exports = {
  upload: upload.array('images', 2), // מקסימום 2 תמונות
  handleUploadErrors,
  deleteBookingImages,
  getUploadsPath
}; 