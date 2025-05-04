const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// טעינת קובץ סביבה
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// טעינת מודל החשבוניות
const Invoice = require('../models/Invoice');

// חיבור למסד הנתונים
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('חיבור למסד הנתונים הצליח');
    deleteAllInvoices();
  })
  .catch(err => {
    console.error('שגיאה בחיבור למסד הנתונים:', err);
    process.exit(1);
  });

/**
 * פונקציה למחיקת כל החשבוניות
 */
async function deleteAllInvoices() {
  try {
    console.log('מתחיל תהליך מחיקת כל החשבוניות...');
    
    // ספירת החשבוניות לפני המחיקה
    const count = await Invoice.countDocuments();
    console.log(`נמצאו ${count} חשבוניות במערכת`);
    
    // מחיקת כל החשבוניות
    const result = await Invoice.deleteMany({});
    console.log(`נמחקו ${result.deletedCount} חשבוניות בהצלחה`);
    
    // מחיקת קבצי PDF של חשבוניות אם קיימים
    const invoicesDir = path.join(process.env.UPLOAD_DIR || 'uploads', 'invoices');
    if (fs.existsSync(invoicesDir)) {
      const files = fs.readdirSync(invoicesDir);
      let deletedFiles = 0;
      
      for (const file of files) {
        if (file.endsWith('.pdf')) {
          fs.unlinkSync(path.join(invoicesDir, file));
          deletedFiles++;
        }
      }
      
      console.log(`נמחקו ${deletedFiles} קבצי PDF של חשבוניות`);
    } else {
      console.log('תיקיית חשבוניות לא נמצאה, אין צורך למחוק קבצים');
    }
    
    console.log('תהליך מחיקת החשבוניות הסתיים בהצלחה');
    
    // ניתוק ממסד הנתונים
    await mongoose.connection.close();
    console.log('ניתוק ממסד הנתונים הצליח');
    process.exit(0);
  } catch (error) {
    console.error('שגיאה במחיקת החשבוניות:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
} 