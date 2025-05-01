const express = require('express');
const router = express.Router();
const roomMappingController = require('../controllers/roomMappingController');
const auth = require('../middleware/auth');

// הגנה על כל הנתיבים - נדרש אימות
router.use(auth);

// קבלת ממירי חדרים לפי מיקום
router.get('/location/:location', roomMappingController.getMappingsByLocation);

// יצירת ממיר חדרים חדש
router.post('/', roomMappingController.createMapping);

// עדכון ממיר חדרים
router.put('/:id', roomMappingController.updateMapping);

// מחיקת ממיר חדרים
router.delete('/:id', roomMappingController.deleteMapping);

// מחיקת כל ממירי החדרים למיקום מסוים
router.delete('/location/:location', roomMappingController.deleteAllMappings);

module.exports = router; 