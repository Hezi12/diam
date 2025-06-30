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
    // בחירת נתיב uploads מתאים לסביבה
    const baseUploadsPath = process.env.NODE_ENV === 'production' 
      ? '/opt/render/project/src/uploads'  // ✅ Render Persistent Disk path
      : path.join(__dirname, '../uploads');
    
    // קביעת היעד לפי סוג ההעלאה ומיקום
    let uploadPath;
    
    // העלאת תמונות לחדר ספציפי (נתיב חדש)
    if (req.route && req.route.path.includes('/upload-images')) {
      // נמצא מזהה החדר מהפרמטרים
      const roomId = req.params.id;
      
      // חיפוש החדר כדי לקבל את המיקום
      const Room = require('../models/Room');
      try {
        const room = await Room.findById(roomId);
        if (room && room.location) {
          uploadPath = path.join(baseUploadsPath, `rooms/${room.location}`);
        } else {
          console.error('לא נמצא חדר או מיקום לא מוגדר');
          uploadPath = path.join(baseUploadsPath, 'temp');
        }
      } catch (error) {
        console.error('שגיאה בחיפוש חדר:', error);
        uploadPath = path.join(baseUploadsPath, 'temp');
      }
    }
    // העלאת תמונה בודדת לחדר (נתיב ישן)
    else if (req.params.roomId) {
      const { location } = req.body;
      uploadPath = path.join(baseUploadsPath, `rooms/${location}`);
    } 
    // העלאת תמונה לגלריית מיקום
    else if (req.params.location) {
      const { location } = req.params;
      uploadPath = path.join(baseUploadsPath, `gallery/${location}`);
    } 
    // יעד ברירת מחדל
    else {
      uploadPath = path.join(baseUploadsPath, 'temp');
    }
    
    // ✅ לוג לבדיקה
    console.log(`🗂️ Upload path determined: ${uploadPath} (NODE_ENV: ${process.env.NODE_ENV})`);
    
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