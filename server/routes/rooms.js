const express = require('express');
const roomsController = require('../controllers/roomsController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// הגנה על כל הנתיבים - נדרש אימות
router.use(auth);

// נתיבים לחדרים
router.get('/', roomsController.getAllRooms);
router.get('/location/:location', roomsController.getRoomsByLocation);
router.get('/single/:id', roomsController.getRoomById);
router.post('/', roomsController.createRoom);
router.put('/:id', roomsController.updateRoom);
router.delete('/:id', roomsController.deleteRoom);

// נתיבים לניהול תמונות
router.post('/upload-image/:roomId', upload.single('image'), roomsController.uploadImage);
router.post('/gallery/:location', upload.single('image'), roomsController.uploadGalleryImage);
router.get('/gallery/:location', roomsController.getGalleryImages);
router.get('/gallery/:location/details', roomsController.getGalleryImagesDetails);
router.delete('/gallery/:id', roomsController.deleteGalleryImage);

module.exports = router; 