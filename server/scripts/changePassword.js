const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

// טעינת הגדרות סביבה
dotenv.config();

/**
 * סקריפט לשינוי סיסמא של משתמש
 * שימוש: node server/scripts/changePassword.js <username> <newPassword>
 */

async function changePassword() {
  try {
    // קבלת פרמטרים מהפקודה
    const username = process.argv[2] || 'hezi';
    const newPassword = process.argv[3] || 'Hezi!3226';

    if (!newPassword) {
      console.error('יש להזין סיסמא חדשה');
      process.exit(1);
    }

    // התחברות למסד הנתונים
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('לא נמצא MONGODB_URI ב-.env או במשתני סביבה');
      console.error('אנא וודא שיש קובץ .env עם MONGODB_URI או הגדר משתנה סביבה');
      process.exit(1);
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('התחברות למסד הנתונים הושלמה בהצלחה');

    // חיפוש המשתמש
    const user = await User.findOne({ username });
    
    if (!user) {
      console.error(`משתמש עם שם המשתמש "${username}" לא נמצא`);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`נמצא משתמש: ${user.name} (${user.username})`);

    // עדכון הסיסמא
    // ה-pre-save hook יוצפן את הסיסמא אוטומטית
    user.password = newPassword;
    await user.save();

    console.log(`✅ הסיסמא עודכנה בהצלחה עבור המשתמש "${username}"`);
    console.log(`הסיסמא החדשה: ${newPassword}`);

  } catch (error) {
    console.error('שגיאה בשינוי הסיסמא:', error);
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
  changePassword();
}

module.exports = changePassword;
