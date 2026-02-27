const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// טעינת הגדרות סביבה
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// רשימת הקולקציות שיש למחוק
const collectionsToDelete = [
  'expensecategories',
  'expenses',
  'financialsummaries',
  'incomecategories',
  'incomes',
  'manualincomes'
];

async function deleteSpecificCollections() {
  try {
    console.log('מתחיל תהליך מחיקת קולקציות שאינן בשימוש...');
    
    // התחברות למסד הנתונים
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error('MONGODB_URI is not defined in .env');
      process.exit(1);
    }
    console.log('מתחבר למסד הנתונים...');
    
    const conn = await mongoose.connect(MONGODB_URI);
    console.log('✓ התחברות למסד הנתונים הצליחה');
    
    // קבלת רשימת הקולקציות הקיימות
    const existingCollections = (await conn.connection.db.listCollections().toArray())
      .map(collection => collection.name);
    
    console.log('\nקולקציות קיימות במסד הנתונים:');
    console.log(existingCollections.join(', '));
    
    // מחיקת הקולקציות המבוקשות
    console.log('\nמחיקת קולקציות:');
    
    for (const collectionName of collectionsToDelete) {
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
    console.log('\nהחיבור למסד הנתונים נסגר');
    
    console.log('\nתהליך מחיקת הקולקציות הסתיים בהצלחה');
    process.exit(0);
  } catch (error) {
    console.error('שגיאה כללית:', error);
    process.exit(1);
  }
}

// הפעלת הפונקציה
deleteSpecificCollections(); 