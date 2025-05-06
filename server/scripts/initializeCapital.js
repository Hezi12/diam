/**
 * סקריפט לאתחול נתוני הון
 * מריץ סנכרון ראשוני של כל ההכנסות וההוצאות במערכת
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Capital = require('../models/Capital');
const Booking = require('../models/Booking');
const Expense = require('../models/Expense');
const ManualIncome = require('../models/ManualIncome');

// טעינת הגדרות סביבה
dotenv.config();

// יצירת חיבור למסד הנתונים
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected');
    initializeCapital();
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

/**
 * אתחול נתוני הון
 * מחשב את כל ההכנסות וההוצאות ומעדכן את נתוני ההון
 */
async function initializeCapital() {
  try {
    console.log('מתחיל אתחול נתוני הון...');
    
    // בדיקה אם כבר קיימים נתוני הון
    let capitalData = await Capital.findOne({ key: 'main' });
    
    if (!capitalData) {
      // יצירת רשומת הון חדשה
      capitalData = await Capital.create({ key: 'main' });
      console.log('נוצרה רשומת הון חדשה');
    } else {
      console.log('נתוני הון קיימים, מאפס את הסכומים הנוכחיים...');
    }
    
    // יצירת אובייקט עם סכומים מאופסים
    const updatedAmounts = {
      cash: 0,
      credit_rothschild: 0,
      credit_or_yehuda: 0,
      transfer_poalim: 0,
      transfer_mizrahi: 0,
      bit_poalim: 0,
      bit_mizrahi: 0,
      paybox_poalim: 0,
      paybox_mizrahi: 0,
      other: 0
    };
    
    // קבלת כל ההזמנות ששולמו
    console.log('מחשב הכנסות מהזמנות...');
    const bookings = await Booking.find({ paymentStatus: { $ne: 'unpaid' } });
    console.log(`נמצאו ${bookings.length} הזמנות ששולמו`);
    
    // חישוב הכנסות לפי אמצעי תשלום
    bookings.forEach(booking => {
      const paymentMethod = booking.paymentStatus;
      
      if (
        paymentMethod && 
        paymentMethod !== 'unpaid' && 
        updatedAmounts.hasOwnProperty(paymentMethod)
      ) {
        updatedAmounts[paymentMethod] += booking.price || 0;
      }
    });
    
    // קבלת כל ההכנסות הידניות
    console.log('מחשב הכנסות ידניות...');
    const manualIncomes = await ManualIncome.find();
    console.log(`נמצאו ${manualIncomes.length} הכנסות ידניות`);
    
    // הוספת הכנסות ידניות לפי אמצעי תשלום
    manualIncomes.forEach(income => {
      const paymentMethod = income.paymentMethod;
      
      if (
        paymentMethod && 
        updatedAmounts.hasOwnProperty(paymentMethod)
      ) {
        updatedAmounts[paymentMethod] += income.amount || 0;
      }
    });
    
    // קבלת כל ההוצאות
    console.log('מחשב הוצאות...');
    const expenses = await Expense.find();
    console.log(`נמצאו ${expenses.length} הוצאות`);
    
    // הפחתת הוצאות לפי אמצעי תשלום
    expenses.forEach(expense => {
      const paymentMethod = expense.paymentMethod;
      
      if (
        paymentMethod && 
        updatedAmounts.hasOwnProperty(paymentMethod)
      ) {
        updatedAmounts[paymentMethod] -= expense.amount || 0;
      }
    });
    
    // עדכון הסכומים בדוקומנט
    capitalData.currentAmounts = updatedAmounts;
    
    // שמירת הנתונים המעודכנים
    capitalData.lastUpdated = new Date();
    await capitalData.save();
    
    // חישוב הסכום הכולל
    const total = capitalData.calculateTotal();
    
    // הדפסת דוח סיכום
    console.log('נתוני הון עודכנו בהצלחה:');
    console.log(`סך הון כולל: ₪${total.toFixed(2)}`);
    console.log('פירוט לפי אמצעי תשלום:');
    
    for (const [method, amount] of Object.entries(updatedAmounts)) {
      const initialAmount = capitalData.initialAmounts[method] || 0;
      const currentAmount = amount || 0;
      const totalAmount = initialAmount + currentAmount;
      
      console.log(`${method}: ₪${totalAmount.toLocaleString()} (התחלתי: ₪${initialAmount}, נוכחי: ₪${currentAmount})`);
    }
    
    console.log('אתחול נתוני הון הושלם בהצלחה!');
    process.exit(0);
  } catch (error) {
    console.error('שגיאה באתחול נתוני הון:', error);
    process.exit(1);
  }
} 