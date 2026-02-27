const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// טעינת הגדרות סביבה
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// שימוש במשתנה סביבה
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env');
  process.exit(1);
}

console.log('מתחבר למסד הנתונים...');

// חיבור למסד נתונים MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    
    try {
      // מחיקת קולקציית invoices
      await mongoose.connection.db.collection('invoices').drop();
      console.log('קולקציית invoices נמחקה בהצלחה');
    } catch (error) {
      if (error.code === 26) {
        console.log('קולקציית invoices לא קיימת');
      } else {
        console.error('שגיאה במחיקת קולקציית invoices:', error);
      }
    }
    
    try {
      // מחיקת קולקציית invoicecounters
      await mongoose.connection.db.collection('invoicecounters').drop();
      console.log('קולקציית invoicecounters נמחקה בהצלחה');
    } catch (error) {
      if (error.code === 26) {
        console.log('קולקציית invoicecounters לא קיימת');
      } else {
        console.error('שגיאה במחיקת קולקציית invoicecounters:', error);
      }
    }
    
    // סגירת החיבור למסד הנתונים
    await mongoose.connection.close();
    console.log('MongoDB Connection Closed');
    
    console.log('הסקריפט הסתיים בהצלחה');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }); 