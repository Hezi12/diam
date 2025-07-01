const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const fs = require('fs-extra');

// טעינת הגדרות סביבה
dotenv.config();

// יצירת תיקיות uploads אם לא קיימות
(async () => {
  try {
    // בחירת נתיב uploads מתאים לסביבה
    const baseUploadsPath = process.env.NODE_ENV === 'production' 
      ? '/opt/render/project/src/uploads'
      : path.join(__dirname, 'uploads');
    
    // וידוא שכל תיקיות ההעלאות קיימות
    await fs.ensureDir(baseUploadsPath);
    await fs.ensureDir(path.join(baseUploadsPath, 'temp'));
    await fs.ensureDir(path.join(baseUploadsPath, 'invoices'));
    await fs.ensureDir(path.join(baseUploadsPath, 'rooms'));
    await fs.ensureDir(path.join(baseUploadsPath, 'rooms/airport'));
    await fs.ensureDir(path.join(baseUploadsPath, 'rooms/rothschild'));
    await fs.ensureDir(path.join(baseUploadsPath, 'gallery'));
    await fs.ensureDir(path.join(baseUploadsPath, 'gallery/airport'));
    await fs.ensureDir(path.join(baseUploadsPath, 'gallery/rothschild'));
    await fs.ensureDir(path.join(baseUploadsPath, 'bookings'));
    await fs.ensureDir(path.join(baseUploadsPath, 'bookings/airport'));
    await fs.ensureDir(path.join(baseUploadsPath, 'bookings/rothschild'));
    console.log('✓ תיקיות ההעלאות נוצרו בהצלחה ב:', baseUploadsPath);
  } catch (err) {
    console.error('שגיאה ביצירת תיקיות העלאה:', err);
    console.error('נתיב שנוסה:', process.env.NODE_ENV === 'production' ? '/opt/render/project/src/uploads' : path.join(__dirname, 'uploads'));
  }
})();

// יצירת אפליקציית Express
const app = express();

// הגדרת פורט
const PORT = process.env.PORT || 3200;

// הגדרת CORS
const corsOptions = {
  origin: function(origin, callback) {
    // בסביבת פיתוח (או כשאין origin כמו בבקשות מהשרת עצמו) אפשר הכל
    if (!origin || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // רשימת דומיינים מאושרים
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3200',
      'https://diam-tau.vercel.app',
      'https://diam-schwartzHezi-gmailcoms-projects.vercel.app',
      'https://diam-git-main-schwartzHezi-gmailcoms-projects.vercel.app',
      'https://diam-client.vercel.app',
      'https://diam-client-git-main.vercel.app',
      'https://diam-client-git-main-bhowmiks-projects.vercel.app'
    ];
    
    // בדיקה אם הדומיין שממנו מגיעה הבקשה מאושר
    // או שהוא תואם את התבניות של vercel/render
    if (allowedOrigins.includes(origin) || 
        /\.vercel\.app$/.test(origin) || 
        /\.onrender\.com$/.test(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS policy violation: ${origin} is not allowed`);
      callback(null, true); // במקום לחסום - נאפשר בכל זאת ונראה בלוג
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Authorization'],
  optionsSuccessStatus: 204,
  preflightContinue: false
};

// Middleware
app.use(cors(corsOptions));
// פתרון נוסף: הוספת מידלוור ספציפי לבקשות preflight
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// הגדרת headers נוספים (רק אם צריך)
app.use((req, res, next) => {
  // לא נכתוב על הגדרות CORS שכבר קיימות
  // רק נוסיף headers נוספים אם צריך
  
  next();
});

// הגדרת נתיב גישה לתמונות - מותאם לסביבה
const uploadsPath = process.env.NODE_ENV === 'production' 
  ? '/opt/render/project/src/uploads'
  : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// חיבור למסד נתונים MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected');
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
  });

// טעינת נתיבי API
const bookingsRoutes = require('./routes/bookings');
const roomsRoutes = require('./routes/rooms');
const authRoutes = require('./routes/auth');
const cleaningRoutes = require('./routes/cleaning');
const roomMappingsRoutes = require('./routes/roomMappings');
const revenueRoutes = require('./routes/revenue');
const capitalRoutes = require('./routes/capital');
const financialRoutes = require('./routes/financial');
const documentsRoutes = require('./routes/documents');
const icountRoutes = require('./routes/icount');
const icalRoutes = require('./routes/ical');
const emailRoutes = require('./routes/email');

// הגדרת נתיבים
app.use('/api/bookings', bookingsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cleaning', cleaningRoutes);
app.use('/api/room-mappings', roomMappingsRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/capital', capitalRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/icount', icountRoutes);
app.use('/api/ical', icalRoutes);
app.use('/api/email', emailRoutes);

// נתיב ברירת מחדל (במקום לשרת קבצים סטטיים)
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Diam API' });
});

// נתיב לבדיקת בריאות השרת
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// טיפול בשגיאות
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'שגיאת שרת פנימית' });
});

// הפעלת שירות הסנכרון האוטומטי
const cronService = require('./services/cronService');
cronService.start().catch(error => {
  console.error('שגיאה בהפעלת שירות הסנכרון האוטומטי:', error);
});

// הפעלת השרת עם טיפול בשגיאות
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`iCal Export URLs:`);
  console.log(`- Airport: http://localhost:${PORT}/api/ical/export/airport/{roomId}`);
  console.log(`- Rothschild: http://localhost:${PORT}/api/ical/export/rothschild/{roomId}`);
});

// טיפול בשגיאות בשרת
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Trying again in 5 seconds...`);
    setTimeout(() => {
      server.close();
      server.listen(PORT);
    }, 5000);
  } else {
    console.error('Server error:', error);
  }
});

// טיפול בסגירת השרת בצורה תקינה
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    // ניתוק ממסד הנתונים - תיקון השיטה כדי להסיר את ה-callback
    mongoose.connection.close()
      .then(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
      })
      .catch(err => {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      });
  });
}); 