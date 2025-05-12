/**
 * סקריפט למחיקת קולקציות שאינן בשימוש במערכת
 * collections to delete: groupbookings, groupcounters, shortlinks
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// טעינת הגדרות סביבה
dotenv.config();

// רשימת הקולקציות למחיקה
const collectionsToDelete = [
  'groupbookings',
  'groupcounters',
  'shortlinks'
];

async function cleanupCollections() {
  try {
    // התחברות לבסיס הנתונים
    console.log('מתחבר לבסיס הנתונים...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('חיבור לבסיס הנתונים הצליח');

    // מחיקת כל קולקציה ברשימה
    for (const collectionName of collectionsToDelete) {
      try {
        console.log(`מוחק קולקציה: ${collectionName}...`);
        
        // בדיקה אם הקולקציה קיימת
        const collections = await mongoose.connection.db.listCollections({name: collectionName}).toArray();
        if (collections.length > 0) {
          // מחיקת הקולקציה
          await mongoose.connection.db.dropCollection(collectionName);
          console.log(`קולקציה ${collectionName} נמחקה בהצלחה`);
        } else {
          console.log(`קולקציה ${collectionName} לא נמצאה`);
        }
      } catch (error) {
        console.error(`שגיאה במחיקת קולקציה ${collectionName}:`, error.message);
      }
    }

    console.log('תהליך הניקוי הסתיים בהצלחה');
  } catch (error) {
    console.error('שגיאה בתהליך הניקוי:', error);
  } finally {
    // סגירת החיבור לבסיס הנתונים
    await mongoose.connection.close();
    console.log('החיבור לבסיס הנתונים נסגר');
    process.exit(0);
  }
}

// הפעלת הפונקציה
cleanupCollections(); 