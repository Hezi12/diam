const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// טעינת הגדרות סביבה
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// שימוש במחרוזת חיבור ישירות כגיבוי אם אין משתנה סביבה
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Hezi:Hezi!3225@cluster0.o8qdhf0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function removeUnusedCollections() {
  try {
    // התחברות למסד הנתונים
    console.log('מתחבר למסד הנתונים...');
    const conn = await mongoose.connect(MONGODB_URI);
    console.log('חיבור למסד הנתונים הצליח');
    
    // רשימת הקולקציות שאינן בשימוש (לפי הניתוח שביצענו)
    const unusedCollections = [
      'capitals',
      'categories',
      'cleaningstatuses',
      'expensecategories',
      'expenses',
      'financialsummaries',
      'financialtransactions',
      'incomecategories',
      'incomes',
      'manualincomes',
      'paymentmethods',
      'roomissues'
    ];
    
    // בדיקה אילו קולקציות קיימות בפועל במסד הנתונים
    const collections = await conn.connection.db.listCollections().toArray();
    const existingCollections = collections.map(col => col.name);
    
    console.log('\nקולקציות קיימות במסד הנתונים:');
    console.log(existingCollections);
    
    console.log('\nמתחיל תהליך מחיקת קולקציות לא נחוצות...');
    
    // מחיקת כל קולקציה לא נחוצה
    for (const collectionName of unusedCollections) {
      if (existingCollections.includes(collectionName)) {
        try {
          await conn.connection.db.collection(collectionName).drop();
          console.log(`✓ הקולקציה ${collectionName} נמחקה בהצלחה`);
        } catch (err) {
          if (err.code === 26) {
            console.log(`הקולקציה ${collectionName} לא קיימת`);
          } else {
            console.error(`שגיאה במחיקת הקולקציה ${collectionName}:`, err);
          }
        }
      } else {
        console.log(`הקולקציה ${collectionName} לא קיימת במסד הנתונים`);
      }
    }
    
    // סגירת החיבור למסד הנתונים
    await mongoose.connection.close();
    console.log('החיבור למסד הנתונים נסגר');
    
    console.log('\nתהליך מחיקת הקולקציות הלא נחוצות הסתיים בהצלחה');
    process.exit(0);
  } catch (error) {
    console.error('שגיאה כללית:', error);
    process.exit(1);
  }
}

// הפעלת הפונקציה
removeUnusedCollections(); 