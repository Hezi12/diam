const PublicSiteSettings = require('../models/PublicSiteSettings');

/**
 * קונטרולר לניהול הגדרות האתר הציבורי
 */

// קבלת הגדרות האתר הציבורי
exports.getSettings = async (req, res) => {
  try {
    const settings = await PublicSiteSettings.getDefaultSettings();
    res.json(settings);
  } catch (error) {
    console.error('שגיאה בקבלת הגדרות האתר הציבורי:', error);
    res.status(500).json({ message: 'שגיאה בקבלת הגדרות האתר הציבורי' });
  }
};

// קבלת הגדרות באנר הנחת השקה (נקודת קצה ציבורית)
exports.getLaunchBannerSettings = async (req, res) => {
  try {
    const settings = await PublicSiteSettings.getDefaultSettings();
    
    // החזרת נתונים מסוננים לציבור
    const bannerSettings = {
      enabled: settings.launchPromotionBanner.enabled && settings.launchPromotionBanner.isCurrentlyValid,
      content: settings.launchPromotionBanner.content,
      displaySettings: settings.launchPromotionBanner.displaySettings
    };
    
    res.json(bannerSettings);
  } catch (error) {
    console.error('שגיאה בקבלת הגדרות באנר הנחת השקה:', error);
    res.status(500).json({ message: 'שגיאה בקבלת הגדרות הבאנר' });
  }
};

// עדכון הגדרות באנר הנחת השקה
exports.updateLaunchBanner = async (req, res) => {
  try {
    const updateData = req.body;
    const userId = req.user ? req.user.id : null;
    
    console.log('מעדכן הגדרות באנר הנחת השקה:', updateData);
    
    const settings = await PublicSiteSettings.updateLaunchBanner(updateData, userId);
    
    console.log('הגדרות באנר הנחת השקה עודכנו בהצלחה');
    
    res.json({
      success: true,
      message: 'הגדרות הבאנר עודכנו בהצלחה',
      settings: settings.launchPromotionBanner
    });
  } catch (error) {
    console.error('שגיאה בעדכון הגדרות באנר הנחת השקה:', error);
    res.status(500).json({ 
      success: false,
      message: 'שגיאה בעדכון הגדרות הבאנר',
      error: error.message 
    });
  }
};

// הפעלה/השבתה מהירה של באנר הנחת השקה
exports.toggleLaunchBanner = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    
    // קבלת המצב הנוכחי
    const currentSettings = await PublicSiteSettings.getDefaultSettings();
    const currentEnabled = currentSettings.launchPromotionBanner.enabled;
    
    // הפיכת המצב
    const newEnabled = !currentEnabled;
    
    console.log(`${newEnabled ? 'מפעיל' : 'משבית'} באנר הנחת השקה (מצב קודם: ${currentEnabled})`);
    
    const settings = await PublicSiteSettings.updateLaunchBanner({ enabled: newEnabled }, userId);
    
    res.json({
      success: true,
      message: `באנר הנחת השקה ${newEnabled ? 'הופעל' : 'הושבת'} בהצלחה`,
      enabled: settings.launchPromotionBanner.enabled
    });
  } catch (error) {
    console.error('שגיאה בהפעלה/השבתה של באנר הנחת השקה:', error);
    res.status(500).json({ 
      success: false,
      message: 'שגיאה בעדכון סטטוס הבאנר',
      error: error.message 
    });
  }
};

// עדכון תוכן הבאנר
exports.updateBannerContent = async (req, res) => {
  try {
    const { content, notes } = req.body;
    const userId = req.user ? req.user.id : null;
    
    console.log('מעדכן תוכן באנר הנחת השקה:', content);
    
    const updateData = { content };
    if (notes) updateData.notes = notes;
    
    const settings = await PublicSiteSettings.updateLaunchBanner(updateData, userId);
    
    res.json({
      success: true,
      message: 'תוכן הבאנר עודכן בהצלחה',
      content: settings.launchPromotionBanner.content
    });
  } catch (error) {
    console.error('שגיאה בעדכון תוכן באנר הנחת השקה:', error);
    res.status(500).json({ 
      success: false,
      message: 'שגיאה בעדכון תוכן הבאנר',
      error: error.message 
    });
  }
};

// עדכון הגדרות תצוגה של הבאנר
exports.updateBannerDisplaySettings = async (req, res) => {
  try {
    const { displaySettings } = req.body;
    const userId = req.user ? req.user.id : null;
    
    console.log('מעדכן הגדרות תצוגה של באנר הנחת השקה:', displaySettings);
    
    const settings = await PublicSiteSettings.updateLaunchBanner({ displaySettings }, userId);
    
    res.json({
      success: true,
      message: 'הגדרות תצוגה עודכנו בהצלחה',
      displaySettings: settings.launchPromotionBanner.displaySettings
    });
  } catch (error) {
    console.error('שגיאה בעדכון הגדרות תצוגה של באנר הנחת השקה:', error);
    res.status(500).json({ 
      success: false,
      message: 'שגיאה בעדכון הגדרות התצוגה',
      error: error.message 
    });
  }
};

// עדכון תאריכי תוקף של הבאנר
exports.updateBannerValidity = async (req, res) => {
  try {
    const { validFrom, validUntil } = req.body;
    const userId = req.user ? req.user.id : null;
    
    console.log('מעדכן תאריכי תוקף של באנר הנחת השקה:', { validFrom, validUntil });
    
    const updateData = {};
    if (validFrom) updateData.validFrom = new Date(validFrom);
    if (validUntil) updateData.validUntil = new Date(validUntil);
    
    const settings = await PublicSiteSettings.updateLaunchBanner(updateData, userId);
    
    res.json({
      success: true,
      message: 'תאריכי תוקף עודכנו בהצלחה',
      validFrom: settings.launchPromotionBanner.validFrom,
      validUntil: settings.launchPromotionBanner.validUntil
    });
  } catch (error) {
    console.error('שגיאה בעדכון תאריכי תוקף של באנר הנחת השקה:', error);
    res.status(500).json({ 
      success: false,
      message: 'שגיאה בעדכון תאריכי התוקף',
      error: error.message 
    });
  }
};

// קבלת הגדרות לוח המודעות
exports.getNoticeBoardSettings = async (req, res) => {
  try {
    const settings = await PublicSiteSettings.getDefaultSettings();
    
    // החזרת הגדרות לוח המודעות בלבד
    const noticeBoardSettings = {
      hideRealGuestNames: settings.noticeBoard?.hideRealGuestNames || false,
      notes: settings.noticeBoard?.notes || '',
      lastUpdatedBy: settings.noticeBoard?.lastUpdatedBy || null
    };
    
    res.json({
      success: true,
      settings: noticeBoardSettings
    });
  } catch (error) {
    console.error('שגיאה בקבלת הגדרות לוח המודעות:', error);
    res.status(500).json({ 
      success: false,
      message: 'שגיאה בקבלת הגדרות לוח המודעות',
      error: error.message 
    });
  }
};

// עדכון הגדרות לוח המודעות
exports.updateNoticeBoardSettings = async (req, res) => {
  try {
    const updateData = req.body;
    const userId = req.user ? req.user.id : null;
    
    console.log('מעדכן הגדרות לוח המודעות:', updateData);
    
    const settings = await PublicSiteSettings.updateNoticeBoardSettings(updateData, userId);
    
    console.log('הגדרות לוח המודעות עודכנו בהצלחה');
    
    res.json({
      success: true,
      message: 'הגדרות לוח המודעות עודכנו בהצלחה',
      settings: settings.noticeBoard
    });
  } catch (error) {
    console.error('שגיאה בעדכון הגדרות לוח המודעות:', error);
    res.status(500).json({ 
      success: false,
      message: 'שגיאה בעדכון הגדרות לוח המודעות',
      error: error.message 
    });
  }
};

// הפעלה/השבתה מהירה של הסתרת שמות אורחים
exports.toggleGuestNamesVisibility = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    
    // קבלת המצב הנוכחי
    const currentSettings = await PublicSiteSettings.getDefaultSettings();
    const currentHideNames = currentSettings.noticeBoard?.hideRealGuestNames || false;
    
    // הפיכת המצב
    const newHideNames = !currentHideNames;
    
    console.log(`${newHideNames ? 'מסתיר' : 'מציג'} שמות אורחים אמיתיים בלוח המודעות (מצב קודם: ${currentHideNames})`);
    
    const settings = await PublicSiteSettings.updateNoticeBoardSettings({ hideRealGuestNames: newHideNames }, userId);
    
    res.json({
      success: true,
      message: `שמות אורחים אמיתיים ${newHideNames ? 'מוסתרים' : 'מוצגים'} כעת בלוח המודעות`,
      hideRealGuestNames: settings.noticeBoard.hideRealGuestNames
    });
  } catch (error) {
    console.error('שגיאה בהפעלה/השבתה של הסתרת שמות אורחים:', error);
    res.status(500).json({ 
      success: false,
      message: 'שגיאה בעדכון הגדרת הצגת שמות אורחים',
      error: error.message 
    });
  }
};

// קבלת הגדרות באנר ההזמנה הישירה (נקודת קצה ציבורית)
exports.getDirectBookingBannerSettings = async (req, res) => {
  try {
    const settings = await PublicSiteSettings.getDefaultSettings();
    
    // החזרת נתונים מסוננים לציבור
    const bannerSettings = {
      enabled: settings.directBookingBanner?.enabled || false,
      discountPercentage: settings.directBookingBanner?.discountPercentage || 15,
      content: settings.directBookingBanner?.content || {
        he: { text: '15% הנחה בהזמנה ישירה' },
        en: { text: '15% OFF for Direct Booking' }
      }
    };
    
    res.json(bannerSettings);
  } catch (error) {
    console.error('שגיאה בקבלת הגדרות באנר ההזמנה הישירה:', error);
    res.status(500).json({ message: 'שגיאה בקבלת הגדרות הבאנר' });
  }
};

// עדכון הגדרות באנר ההזמנה הישירה
exports.updateDirectBookingBanner = async (req, res) => {
  try {
    const updateData = req.body;
    const userId = req.user ? req.user.id : null;
    
    console.log('מעדכן הגדרות באנר ההזמנה הישירה:', updateData);
    
    const settings = await PublicSiteSettings.updateDirectBookingBanner(updateData, userId);
    
    console.log('הגדרות באנר ההזמנה הישירה עודכנו בהצלחה');
    
    res.json({
      success: true,
      message: 'הגדרות הבאנר עודכנו בהצלחה',
      settings: settings.directBookingBanner
    });
  } catch (error) {
    console.error('שגיאה בעדכון הגדרות באנר ההזמנה הישירה:', error);
    res.status(500).json({ 
      success: false,
      message: 'שגיאה בעדכון הגדרות הבאנר',
      error: error.message 
    });
  }
};

// הפעלה/השבתה מהירה של באנר ההזמנה הישירה
exports.toggleDirectBookingBanner = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    
    // קבלת המצב הנוכחי
    const currentSettings = await PublicSiteSettings.getDefaultSettings();
    const currentEnabled = currentSettings.directBookingBanner?.enabled || false;
    
    // הפיכת המצב
    const newEnabled = !currentEnabled;
    
    console.log(`${newEnabled ? 'מפעיל' : 'משבית'} באנר ההזמנה הישירה (מצב קודם: ${currentEnabled})`);
    
    const settings = await PublicSiteSettings.updateDirectBookingBanner({ enabled: newEnabled }, userId);
    
    res.json({
      success: true,
      message: `באנר ההזמנה הישירה ${newEnabled ? 'הופעל' : 'הושבת'} בהצלחה`,
      enabled: settings.directBookingBanner.enabled
    });
  } catch (error) {
    console.error('שגיאה בהפעלה/השבתה של באנר ההזמנה הישירה:', error);
    res.status(500).json({ 
      success: false,
      message: 'שגיאה בעדכון סטטוס הבאנר',
      error: error.message 
    });
  }
};
