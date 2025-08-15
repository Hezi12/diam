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
    const { enabled } = req.body;
    const userId = req.user ? req.user.id : null;
    
    console.log(`${enabled ? 'מפעיל' : 'משבית'} באנר הנחת השקה`);
    
    const settings = await PublicSiteSettings.updateLaunchBanner({ enabled }, userId);
    
    res.json({
      success: true,
      message: `באנר הנחת השקה ${enabled ? 'הופעל' : 'הושבת'} בהצלחה`,
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
