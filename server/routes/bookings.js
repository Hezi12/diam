const express = require('express');
const bookingsController = require('../controllers/bookingsController');
const auth = require('../middleware/auth');

const router = express.Router();

// נתיבים ציבוריים - לא דורשים אימות
// נתיבים אלו משמשים את האתר הציבורי להזמנות
router.get('/check-availability', bookingsController.checkRoomAvailability);
router.get('/public/check-availability', bookingsController.checkRoomAvailability);
router.post('/public/create', bookingsController.createPublicBooking);

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