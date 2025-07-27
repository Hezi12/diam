/**
 * סקריפט מיגרציה להוספת שיטת תשלום "cash2" למערכת
 * מעדכן את מודל ההון כדי לכלול את השדה החדש
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// טעינת משתני סביבה
dotenv.config();

// מודלים
const Capital = require('../models/Capital');

async function addCash2PaymentMethod() {
  try {
    console.log('מתחבר למסד הנתונים...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('התחברות למסד הנתונים הושלמה בהצלחה');

    console.log('מחפש רשומת הון קיימת...');
    let capitalData = await Capital.findOne({ key: 'main' });
    
    if (!capitalData) {
      console.log('לא נמצאה רשומת הון קיימת, יוצר חדשה...');
      capitalData = await Capital.create({ key: 'main' });
      console.log('רשומת הון חדשה נוצרה בהצלחה');
    } else {
      console.log('נמצאה רשומת הון קיימת');
    }

    // בדיקה האם השדה כבר קיים
    if (capitalData.initialAmounts.cash2 !== undefined) {
      console.log('שדה cash2 כבר קיים ברשומת ההון');
    } else {
      console.log('מוסיף שדה cash2 לרשומת ההון...');
      
      // הוספת השדה החדש
      capitalData.initialAmounts.cash2 = 0;
      capitalData.currentAmounts.cash2 = 0;
      
      // שמירה
      await capitalData.save();
      console.log('שדה cash2 נוסף בהצלחה לרשומת ההון');
    }

    console.log('מיגרציה הושלמה בהצלחה!');
    console.log('סיכום השדות ברשומת ההון:');
    console.log('- initialAmounts:', Object.keys(capitalData.initialAmounts));
    console.log('- currentAmounts:', Object.keys(capitalData.currentAmounts));

  } catch (error) {
    console.error('שגיאה במיגרציה:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('התנתקות ממסד הנתונים');
    process.exit(0);
  }
}

// הרצת המיגרציה
addCash2PaymentMethod();
