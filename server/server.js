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
    // וידוא שכל תיקיות ההעלאות קיימות
    await fs.ensureDir(path.join(__dirname, 'uploads'));
    await fs.ensureDir(path.join(__dirname, 'uploads/temp'));
    await fs.ensureDir(path.join(__dirname, 'uploads/invoices'));
    await fs.ensureDir(path.join(__dirname, 'uploads/rooms'));
    await fs.ensureDir(path.join(__dirname, 'uploads/rooms/airport'));
    await fs.ensureDir(path.join(__dirname, 'uploads/rooms/rothschild'));
    await fs.ensureDir(path.join(__dirname, 'uploads/gallery'));
    await fs.ensureDir(path.join(__dirname, 'uploads/gallery/airport'));
    await fs.ensureDir(path.join(__dirname, 'uploads/gallery/rothschild'));
    console.log('✓ תיקיות ההעלאות נוצרו בהצלחה');
  } catch (err) {
    console.error('שגיאה ביצירת תיקיות העלאה:', err);
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
      'https://diam-client-git-main.vercel.app'
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

// הגדרת headers לפתרון בעיות CORS - מוודא שכל הנתיבים מקבלים את ה-headers הנכונים
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // תשובה מהירה לבקשות preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// הגדרת נתיב גישה לתמונות - חדש!
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
const invoicesRoutes = require('./routes/invoices');
const cleaningRoutes = require('./routes/cleaning');

// הגדרת נתיבים
app.use('/api/bookings', bookingsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/invoices', cors(corsOptions), invoicesRoutes);
app.use('/api/cleaning', cleaningRoutes);

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

// הפעלת השרת עם טיפול בשגיאות
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
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