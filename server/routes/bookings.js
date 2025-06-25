const express = require('express');
const bookingsController = require('../controllers/bookingsController');
const auth = require('../middleware/auth');
const { upload, handleUploadErrors } = require('../middleware/bookingImageUpload');

const router = express.Router();

// נתיבים ציבוריים - לא דורשים אימות
// נתיבים אלו משמשים את האתר הציבורי להזמנות
router.get('/check-availability', bookingsController.checkRoomAvailability);
router.get('/public/check-availability', bookingsController.checkRoomAvailability);
router.post('/public/create', bookingsController.createPublicBooking);

// נתיבי תמונות עם אימות מיוחד - לפני הגנה כללית
// Middleware מיוחד לתמונות שמקבל טוקן גם מ-query parameter
const authWithQuery = (req, res, next) => {
  console.log('🔑 authWithQuery called:', {
    hasAuthHeader: !!req.headers.authorization,
    hasTokenQuery: !!req.query.token,
    url: req.url,
    method: req.method
  });
  
  // בדיקה אם יש טוקן ב-headers
  let token = req.headers.authorization;
  
  // אם אין טוקן ב-headers, בדוק ב-query parameter
  if (!token && req.query.token) {
    token = `Bearer ${req.query.token}`;
    req.headers.authorization = token;
    console.log('🔑 Added token from query parameter');
  }
  
  if (!token) {
    console.log('❌ No token found in headers or query');
    return res.status(401).json({ message: 'אין הרשאה, דרושה התחברות' });
  }
  
  console.log('🔑 Token found, calling auth middleware');
  
  // קריאה ל-middleware הרגיל של auth
  auth(req, res, next);
};

// נתיבים לתמונות הזמנות
router.post('/:id/images', authWithQuery, upload, bookingsController.uploadBookingImages);
router.delete('/:id/images/:imageIndex', authWithQuery, bookingsController.deleteBookingImage);
router.get('/:id/images/:imageIndex', (req, res, next) => {
  console.log('📸 Image request received:', {
    url: req.originalUrl,
    params: req.params,
    query: req.query,
    hasAuth: !!req.headers.authorization
  });
  next();
}, authWithQuery, bookingsController.getBookingImage);

// הגנה על שאר הנתיבים - נדרש אימות
router.use(auth);

// נתיבים להזמנות
router.get('/', bookingsController.getAllBookings);
router.get('/location/:location', bookingsController.getBookingsByLocation);
router.get('/date-range', bookingsController.getBookingsByDateRange);
router.get('/single/:id', bookingsController.getBookingById);
router.post('/', bookingsController.createBooking);
router.put('/:id', bookingsController.updateBooking);
router.delete('/:id', bookingsController.deleteBooking);

// נתיבים נוספים
router.get('/search', bookingsController.searchBookings);

module.exports = router; 