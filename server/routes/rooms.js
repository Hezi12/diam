const express = require('express');
const roomsController = require('../controllers/roomsController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// נתיבים ציבוריים - לא דורשים אימות
// אלה משמשים את האתר הציבורי
router.get('/public/location/:location', roomsController.getPublicRoomsByLocation);
router.get('/public/single/:id', roomsController.getPublicRoomById);
router.get('/gallery/:location', roomsController.getGalleryImages);
router.get('/gallery/:location/details', roomsController.getGalleryImagesDetails);

// הגנה על שאר הנתיבים - נדרש אימות
router.use(auth);

// נתיבים לחדרים
router.get('/', roomsController.getAllRooms);
router.get('/location/:location', roomsController.getRoomsByLocation);
router.get('/single/:id', roomsController.getRoomById);
router.get('/available', roomsController.getAvailableRooms);
router.post('/', roomsController.createRoom);
router.put('/:id', roomsController.updateRoom);
router.delete('/:id', roomsController.deleteRoom);

// נתיבים לניהול תמונות
router.post('/upload-image/:roomId', upload.single('image'), roomsController.uploadImage);
router.post('/gallery/:location', upload.single('image'), roomsController.uploadGalleryImage);
router.delete('/gallery/:id', roomsController.deleteGalleryImage);

module.exports = router; 