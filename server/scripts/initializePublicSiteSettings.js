const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PublicSiteSettings = require('../models/PublicSiteSettings');

// טעינת הגדרות סביבה
dotenv.config();

/**
 * סקריפט לאתחול הגדרות האתר הציבורי
 * יוצר את המסמך הראשוני עם ההגדרות הבסיסיות
 */
async function initializePublicSiteSettings() {
  try {
    // התחברות למסד הנתונים
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('התחברות למסד הנתונים הושלמה בהצלחה');

    // בדיקה אם ההגדרות כבר קיימות
    const existingSettings = await PublicSiteSettings.findOne({ settingsId: 'default' });
    
    if (existingSettings) {
      console.log('הגדרות האתר הציבורי כבר קיימות במסד הנתונים');
      console.log('מצב באנר הנחת השקה:', existingSettings.launchPromotionBanner.enabled ? 'פעיל' : 'כבוי');
      return;
    }

    // יצירת הגדרות ברירת מחדל
    const defaultSettings = await PublicSiteSettings.getDefaultSettings();
    
    console.log('הגדרות האתר הציבורי נוצרו בהצלחה!');
    console.log('מצב באנר הנחת השקה:', defaultSettings.launchPromotionBanner.enabled ? 'פעיל' : 'כבוי');
    console.log('תוכן הבאנר בעברית:', defaultSettings.launchPromotionBanner.content.he.title);
    console.log('תוכן הבאנר באנגלית:', defaultSettings.launchPromotionBanner.content.en.title);

  } catch (error) {
    console.error('שגיאה באתחול הגדרות האתר הציבורי:', error);
    process.exit(1);
  } finally {
    // סגירת החיבור למסד הנתונים
    await mongoose.connection.close();
    console.log('החיבור למסד הנתונים נסגר');
    process.exit(0);
  }
}

// הרצת הסקריפט
if (require.main === module) {
  initializePublicSiteSettings();
}

module.exports = initializePublicSiteSettings;
