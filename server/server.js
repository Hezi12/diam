const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');

// טעינת הגדרות סביבה
dotenv.config();

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// הגדרת headers לפתרון בעיות CORS
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

// הגדרת נתיבים
app.use('/api/bookings', bookingsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoicesRoutes);

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

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 