const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const publicSiteController = require('../controllers/publicSiteController');

/**
 * נתיבי API לניהול הגדרות האתר הציבורי
 */

// נתיבים ציבוריים (ללא אימות)
// קבלת הגדרות באנר הנחת השקה
router.get('/banner/launch', publicSiteController.getLaunchBannerSettings);

// קבלת הגדרות באנר ההזמנה הישירה
router.get('/banner/direct-booking', publicSiteController.getDirectBookingBannerSettings);

// נתיבים מוגנים (עם אימות)
// קבלת כל הגדרות האתר הציבורי
router.get('/settings', auth, publicSiteController.getSettings);

// עדכון הגדרות באנר הנחת השקה
router.put('/banner/launch', auth, publicSiteController.updateLaunchBanner);

// הפעלה/השבתה מהירה של באנר הנחת השקה
router.patch('/banner/launch/toggle', auth, publicSiteController.toggleLaunchBanner);

// עדכון תוכן הבאנר
router.patch('/banner/launch/content', auth, publicSiteController.updateBannerContent);

// עדכון הגדרות תצוגה של הבאנר
router.patch('/banner/launch/display', auth, publicSiteController.updateBannerDisplaySettings);

// עדכון תאריכי תוקף של הבאנר
router.patch('/banner/launch/validity', auth, publicSiteController.updateBannerValidity);

// נתיבים עבור הגדרות לוח המודעות
// קבלת הגדרות לוח המודעות
router.get('/notice-board/settings', auth, publicSiteController.getNoticeBoardSettings);

// עדכון הגדרות לוח המודעות
router.put('/notice-board/settings', auth, publicSiteController.updateNoticeBoardSettings);

// הפעלה/השבתה מהירה של הסתרת שמות אורחים
router.patch('/notice-board/toggle-guest-names', auth, publicSiteController.toggleGuestNamesVisibility);

// נתיבים עבור באנר ההזמנה הישירה
// עדכון הגדרות באנר ההזמנה הישירה
router.put('/banner/direct-booking', auth, publicSiteController.updateDirectBookingBanner);

// הפעלה/השבתה מהירה של באנר ההזמנה הישירה
router.patch('/banner/direct-booking/toggle', auth, publicSiteController.toggleDirectBookingBanner);

module.exports = router;
