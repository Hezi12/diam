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

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

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
const authRoutes = require('./routes/auth');
const roomsRoutes = require('./routes/rooms');
const bookingsRoutes = require('./routes/bookings');

// הגדרת נתיבי API
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/bookings', bookingsRoutes);

// שירות קבצים סטטיים בסביבת ייצור
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

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