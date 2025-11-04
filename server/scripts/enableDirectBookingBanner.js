/**
 * סקריפט להפעלת באנר ההזמנה הישירה
 * מפעיל את הבאנר אם הוא כבוי או לא קיים
 */

const mongoose = require('mongoose');
const PublicSiteSettings = require('../models/PublicSiteSettings');
require('dotenv').config();

async function enableDirectBookingBanner() {
  try {
    // חיבור למסד הנתונים
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/diam-hotel', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('מתחבר למסד הנתונים...');
    
    // קבלת הגדרות
    const settings = await PublicSiteSettings.getDefaultSettings();
    
    // אם הבאנר לא קיים או כבוי, נפעיל אותו
    if (!settings.directBookingBanner || !settings.directBookingBanner.enabled) {
      console.log('מפעיל את באנר ההזמנה הישירה...');
      
      await PublicSiteSettings.updateDirectBookingBanner({ 
        enabled: true 
      });
      
      console.log('✅ באנר ההזמנה הישירה הופעל בהצלחה!');
    } else {
      console.log('✅ באנר ההזמנה הישירה כבר פעיל');
    }
    
    // סגירת חיבור
    await mongoose.connection.close();
    console.log('חיבור נסגר');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ שגיאה:', error);
    process.exit(1);
  }
}

// הרצת הסקריפט
enableDirectBookingBanner();

