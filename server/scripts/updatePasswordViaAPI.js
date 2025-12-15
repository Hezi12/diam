const axios = require('axios');
require('dotenv').config();

/**
 * סקריפט לעדכון סיסמא דרך API
 * שימוש: node server/scripts/updatePasswordViaAPI.js <username> <oldPassword> <newPassword>
 * 
 * דוגמה: node server/scripts/updatePasswordViaAPI.js hezi hezi3225 "Hezi!3226"
 */

async function updatePasswordViaAPI() {
  try {
    // קבלת פרמטרים מהפקודה
    const username = process.argv[2] || 'hezi';
    const oldPassword = process.argv[3] || 'hezi3225';
    const newPassword = process.argv[4] || 'Hezi!3226';

    if (!newPassword) {
      console.error('יש להזין סיסמא חדשה');
      process.exit(1);
    }

    // קביעת כתובת השרת
    const serverUrl = process.env.SERVER_URL || 'http://localhost:3200';
    console.log(`מתחבר לשרת: ${serverUrl}`);

    // שלב 1: התחברות עם הסיסמא הישנה
    console.log(`מתחבר עם שם משתמש: ${username}...`);
    const loginResponse = await axios.post(`${serverUrl}/api/auth/login`, {
      username,
      password: oldPassword
    });

    if (!loginResponse.data.token) {
      console.error('❌ התחברות נכשלה - בדוק את שם המשתמש והסיסמא הישנה');
      process.exit(1);
    }

    const token = loginResponse.data.token;
    console.log('✅ התחברות הצליחה');

    // שלב 2: עדכון הסיסמא
    console.log(`מעדכן סיסמא עבור המשתמש: ${username}...`);
    const changePasswordResponse = await axios.post(
      `${serverUrl}/api/auth/change-password`,
      {
        username,
        newPassword,
        oldPassword
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (changePasswordResponse.data.success) {
      console.log(`✅ הסיסמא עודכנה בהצלחה עבור המשתמש "${username}"`);
      console.log(`הסיסמא החדשה: ${newPassword}`);
      console.log('\n⚠️  חשוב: שמור את הסיסמא החדשה במקום בטוח!');
    } else {
      console.error('❌ עדכון הסיסמא נכשל');
      process.exit(1);
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ שגיאה מהשרת:', error.response.data.message || error.response.statusText);
      if (error.response.status === 401) {
        console.error('הסיסמא הישנה שגויה או אין הרשאה');
      }
    } else if (error.request) {
      console.error('❌ לא התקבלה תשובה מהשרת');
      console.error('ודא שהשרת רץ על:', process.env.SERVER_URL || 'http://localhost:3200');
    } else {
      console.error('❌ שגיאה:', error.message);
    }
    process.exit(1);
  }
}

// הרצת הסקריפט
if (require.main === module) {
  updatePasswordViaAPI();
}

module.exports = updatePasswordViaAPI;
