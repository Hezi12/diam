const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// וידוא שהתיקייה קיימת
const ensureDir = async (dirPath) => {
  try {
    await fs.ensureDir(dirPath);
  } catch (error) {
    console.error(`שגיאה ביצירת תיקייה ${dirPath}:`, error);
    throw error;
  }
};

// הגדרות אחסון בסיסיות
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // קביעת היעד לפי סוג ההעלאה ומיקום
    let uploadPath;
    
    if (req.params.roomId) {
      // תמונה לחדר ספציפי
      const { location } = req.body;
      uploadPath = path.join(__dirname, `../uploads/rooms/${location}`);
    } else if (req.params.location) {
      // תמונה לגלריית מיקום
      const { location } = req.params;
      uploadPath = path.join(__dirname, `../uploads/gallery/${location}`);
    } else {
      // אם לא נקבע יעד ספציפי (לא אמור לקרות)
      uploadPath = path.join(__dirname, '../uploads/temp');
    }
    
    // וידוא שהתיקייה קיימת
    await ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // יצירת שם קובץ ייחודי
    const uniqueSuffix = Date.now() + '-' + uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  }
});

// פילטר קבצים - רק תמונות מותרות
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('מותר להעלות רק קבצי תמונה'), false);
  }
};

// הגדרות העלאה
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // מקס' 5MB
  }
});

module.exports = upload; 