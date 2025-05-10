const express = require('express');
const bookingsController = require('../controllers/bookingsController');
const auth = require('../middleware/auth');

const router = express.Router();

// נתיבים פומביים שאינם דורשים אימות
router.get('/payment-info/:id', bookingsController.getBookingPaymentInfo);
router.post('/submit-payment', bookingsController.submitPaymentDetails);

// נתיבים מוגנים - דורשים אימות
router.get('/', auth, bookingsController.getAllBookings);
router.get('/location/:location', auth, bookingsController.getBookingsByLocation);
router.get('/date-range', auth, bookingsController.getBookingsByDateRange);
router.get('/single/:id', auth, bookingsController.getBookingById);
router.post('/', auth, bookingsController.createBooking);
router.put('/:id', auth, bookingsController.updateBooking);
router.delete('/:id', auth, bookingsController.deleteBooking);

// נתיבים נוספים - גם הם מוגנים
router.get('/check-availability', auth, bookingsController.checkRoomAvailability);
router.get('/search', auth, bookingsController.searchBookings);

module.exports = router; 