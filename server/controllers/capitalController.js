const Capital = require('../models/Capital');
const Booking = require('../models/Booking');
const Expense = require('../models/Expense');
const ManualIncome = require('../models/ManualIncome');
const { startOfMonth, endOfMonth } = require('date-fns');

/**
 * קבלת נתוני הון - סכומים התחלתיים ונוכחיים וסיכום כללי
 */
exports.getCapitalData = async (req, res) => {
  try {
    // מחפש את רשומת ההון או יוצר חדשה אם לא קיימת
    let capitalData = await Capital.findOne({ key: 'main' });
    
    if (!capitalData) {
      capitalData = await Capital.create({ key: 'main' });
    }
    
    // חישוב הסכום הכולל
    const total = capitalData.calculateTotal();
    
    // הכנת התשובה
    const response = {
      initialAmounts: capitalData.initialAmounts,
      currentAmounts: capitalData.currentAmounts,
      lastUpdated: capitalData.lastUpdated,
      total
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('שגיאה בטעינת נתוני הון:', error);
    res.status(500).json({ message: 'שגיאה בטעינת נתוני הון', error: error.message });
  }
};

/**
 * עדכון סכום התחלתי לאמצעי תשלום
 */
exports.updateInitialAmount = async (req, res) => {
  try {
    const { paymentMethod, amount } = req.body;
    
    if (!paymentMethod || amount === undefined) {
      return res.status(400).json({ message: 'חסרים נתונים: נדרש אמצעי תשלום וסכום' });
    }
    
    // אימות שאמצעי התשלום תקין
    const validPaymentMethods = [
      'cash', 'cash2', 'credit_rothschild', 'credit_or_yehuda', 
      'transfer_poalim', 'transfer_mizrahi', 
      'bit_poalim', 'bit_mizrahi', 
      'paybox_poalim', 'paybox_mizrahi', 
      'other'
    ];
    
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: 'אמצעי תשלום לא תקין' });
    }
    
    // קבלת המשתמש הנוכחי (אם יש)
    const userId = req.user ? req.user.id : null;
    
    // עדכון סכום ההון
    let capitalData = await Capital.findOne({ key: 'main' });
    
    if (!capitalData) {
      capitalData = await Capital.create({ key: 'main' });
    }
    
    // עדכון הסכום והוספה להיסטוריה
    capitalData.updateInitialAmount(paymentMethod, amount, userId);
    await capitalData.save();
    
    // חישוב הסכום הכולל
    const total = capitalData.calculateTotal();
    
    res.status(200).json({
      success: true,
      initialAmounts: capitalData.initialAmounts,
      total
    });
  } catch (error) {
    console.error('שגיאה בעדכון סכום התחלתי:', error);
    res.status(500).json({ message: 'שגיאה בעדכון סכום התחלתי', error: error.message });
  }
};

/**
 * קבלת היסטוריית עדכוני הון
 */
exports.getCapitalHistory = async (req, res) => {
  try {
    const capitalData = await Capital.findOne({ key: 'main' })
      .populate('history.updatedBy', 'username');
    
    if (!capitalData) {
      return res.status(404).json({ message: 'לא נמצאו נתוני הון' });
    }
    
    res.status(200).json(capitalData.history);
  } catch (error) {
    console.error('שגיאה בטעינת היסטוריית הון:', error);
    res.status(500).json({ message: 'שגיאה בטעינת היסטוריית הון', error: error.message });
  }
};

/**
 * סנכרון נתוני הון עם הכנסות והוצאות לחודש מסוים
 * מעדכן את הסכומים הנוכחיים על פי ההכנסות וההוצאות
 */
exports.syncMonthlyCapital = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    if (!year || !month) {
      return res.status(400).json({ message: 'חסרים נתונים: נדרשים שנה וחודש' });
    }
    
    // המרת פרמטרים למספרים
    const numericYear = parseInt(year);
    const numericMonth = parseInt(month);
    
    // יצירת תאריכי התחלה וסיום לחודש
    const startDate = startOfMonth(new Date(numericYear, numericMonth - 1));
    const endDate = endOfMonth(new Date(numericYear, numericMonth - 1));
    
    // קבלת נתוני הון נוכחיים
    let capitalData = await Capital.findOne({ key: 'main' });
    
    if (!capitalData) {
      capitalData = await Capital.create({ key: 'main' });
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
    
    // קבלת הכנסות מהזמנות
    const bookings = await Booking.find({
      paymentStatus: { $ne: 'unpaid' },
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // חישוב הכנסות מהזמנות לפי אמצעי תשלום
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
    
    // קבלת הכנסות ידניות
    const manualIncomes = await ManualIncome.find({
      date: { $gte: startDate, $lte: endDate }
    });
    
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
    
    // קבלת הוצאות
    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate }
    });
    
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
    
    res.status(200).json({
      success: true,
      initialAmounts: capitalData.initialAmounts,
      currentAmounts: capitalData.currentAmounts,
      lastUpdated: capitalData.lastUpdated,
      total
    });
  } catch (error) {
    console.error('שגיאה בסנכרון נתוני הון:', error);
    res.status(500).json({ message: 'שגיאה בסנכרון נתוני הון', error: error.message });
  }
};

/**
 * סנכרון מלא של נתוני הון עם כל ההכנסות וההוצאות
 * מעדכן את הסכומים הנוכחיים על פי כל ההכנסות וההוצאות במערכת
 */
exports.syncFullCapital = async (req, res) => {
  try {
    console.log('מתחיל סנכרון מלא של נתוני הון...');
    
    // קבלת נתוני הון נוכחיים
    let capitalData = await Capital.findOne({ key: 'main' });
    
    if (!capitalData) {
      capitalData = await Capital.create({ key: 'main' });
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
    
    // קבלת כל ההכנסות מהזמנות
    const bookings = await Booking.find({
      paymentStatus: { $ne: 'unpaid' }
    });
    console.log(`נמצאו ${bookings.length} הזמנות עם תשלום`);
    
    // חישוב הכנסות מהזמנות לפי אמצעי תשלום
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
    console.log('נתוני הון עודכנו בהצלחה');
    
    // תחשיב נתוני הכנסות והוצאות לכל אמצעי תשלום עבור התצוגה
    const paymentTypes = [
      'cash', 'credit_rothschild', 'credit_or_yehuda', 
      'transfer_poalim', 'transfer_mizrahi', 
      'bit_poalim', 'bit_mizrahi', 
      'paybox_poalim', 'paybox_mizrahi', 
      'other'
    ];
    
    const paymentMethodsData = paymentTypes.map(method => {
      const initialAmount = capitalData.initialAmounts[method] || 0;
      const currentAmount = capitalData.currentAmounts[method] || 0;
      const totalAmount = initialAmount + currentAmount;
      
      return {
        method,
        initialAmount,
        currentAmount,
        totalAmount
      };
    });
    
    // חישוב סך הכל ללא אמצעי תשלום מסוימים
    const filteredTotal = paymentMethodsData.reduce((sum, item) => {
      if (item.method === 'credit_or_yehuda' || item.method === 'credit_rothschild') {
        return sum;
      }
      return sum + item.totalAmount;
    }, 0);
    
    res.status(200).json({
      success: true,
      initialAmounts: capitalData.initialAmounts,
      currentAmounts: capitalData.currentAmounts,
      lastUpdated: capitalData.lastUpdated,
      paymentMethods: paymentMethodsData,
      total: filteredTotal  // שימוש בסכום המסונן במקום הכולל
    });
  } catch (error) {
    console.error('שגיאה בסנכרון מלא של נתוני הון:', error);
    res.status(500).json({ message: 'שגיאה בסנכרון מלא של נתוני הון', error: error.message });
  }
};

/**
 * מחשב את נתוני ההון והכנסות/הוצאות של העסק
 * כולל מידע מצטבר מכל המתחמים
 */
exports.getFullFinancialData = async (req, res) => {
  try {
    console.log('טוען נתונים פיננסיים מלאים...');
    
    // קבלת נתוני הון נוכחיים
    let capitalData = await Capital.findOne({ key: 'main' });
    
    if (!capitalData) {
      capitalData = await Capital.create({ key: 'main' });
    }
    
    // חישוב הסכום הכולל
    const total = capitalData.calculateTotal();
    
    // תחשיב נתוני הכנסות והוצאות לכל אמצעי תשלום
    const paymentTypes = [
      'cash', 'credit_rothschild', 'credit_or_yehuda', 
      'transfer_poalim', 'transfer_mizrahi', 
      'bit_poalim', 'bit_mizrahi', 
      'paybox_poalim', 'paybox_mizrahi', 
      'other'
    ];
    
    // הכנת נתוני מידע לחזרה
    const paymentMethodsData = paymentTypes.map(method => {
      const initialAmount = capitalData.initialAmounts[method] || 0;
      const currentAmount = capitalData.currentAmounts[method] || 0;
      const totalAmount = initialAmount + currentAmount;
      
      return {
        method,
        initialAmount,
        currentAmount,
        totalAmount
      };
    });
    
    // חישוב סך הכל ללא אמצעי תשלום מסוימים
    const filteredTotal = paymentMethodsData.reduce((sum, item) => {
      if (item.method === 'credit_or_yehuda' || item.method === 'credit_rothschild') {
        return sum;
      }
      return sum + item.totalAmount;
    }, 0);
    
    res.status(200).json({
      success: true,
      initialAmounts: capitalData.initialAmounts,
      currentAmounts: capitalData.currentAmounts,
      lastUpdated: capitalData.lastUpdated,
      paymentMethods: paymentMethodsData,
      total: filteredTotal  // שימוש בסכום המסונן במקום הכולל
    });
  } catch (error) {
    console.error('שגיאה בטעינת נתונים פיננסיים מלאים:', error);
    res.status(500).json({ message: 'שגיאה בטעינת נתונים פיננסיים מלאים', error: error.message });
  }
};

/**
 * עדכון אוטומטי של הון בעת הוספת הכנסה חדשה
 * פונקציה זו תיקרא על ידי controller אחרים לאחר יצירת הכנסה
 */
exports.updateCapitalOnNewIncome = async (paymentMethod, amount) => {
  try {
    // אם אמצעי התשלום לא תקין, לא עושים כלום
    if (!paymentMethod || paymentMethod === 'unpaid' || amount <= 0) {
      return;
    }
    
    // קבלת נתוני הון
    let capitalData = await Capital.findOne({ key: 'main' });
    
    if (!capitalData) {
      capitalData = await Capital.create({ key: 'main' });
    }
    
    // וידוא שיש שדה מתאים
    if (capitalData.currentAmounts.hasOwnProperty(paymentMethod)) {
      // עדכון הסכום
      capitalData.currentAmounts[paymentMethod] += amount;
      capitalData.lastUpdated = new Date();
      await capitalData.save();
    }
  } catch (error) {
    console.error('שגיאה בעדכון הון לאחר הכנסה חדשה:', error);
  }
};

/**
 * עדכון אוטומטי של הון בעת הוספת הוצאה חדשה
 * פונקציה זו תיקרא על ידי controller אחרים לאחר יצירת הוצאה
 */
exports.updateCapitalOnNewExpense = async (paymentMethod, amount) => {
  try {
    // אם אמצעי התשלום לא תקין, לא עושים כלום
    if (!paymentMethod || amount <= 0) {
      return;
    }
    
    // קבלת נתוני הון
    let capitalData = await Capital.findOne({ key: 'main' });
    
    if (!capitalData) {
      capitalData = await Capital.create({ key: 'main' });
    }
    
    // וידוא שיש שדה מתאים
    if (capitalData.currentAmounts.hasOwnProperty(paymentMethod)) {
      // עדכון הסכום (הפחתה)
      capitalData.currentAmounts[paymentMethod] -= amount;
      capitalData.lastUpdated = new Date();
      await capitalData.save();
    }
  } catch (error) {
    console.error('שגיאה בעדכון הון לאחר הוצאה חדשה:', error);
  }
};

/**
 * עדכון אוטומטי של הון בעת מחיקת הוצאה
 * פונקציה זו תיקרא על ידי controller אחרים בעת מחיקת הוצאה
 */
exports.revertCapitalOnExpenseDelete = async (paymentMethod, amount) => {
  try {
    // אם אמצעי התשלום לא תקין, לא עושים כלום
    if (!paymentMethod || amount <= 0) {
      return;
    }
    
    // קבלת נתוני הון
    let capitalData = await Capital.findOne({ key: 'main' });
    
    if (!capitalData) {
      return; // אם אין נתוני הון, אין מה לעדכן
    }
    
    // וידוא שיש שדה מתאים
    if (capitalData.currentAmounts.hasOwnProperty(paymentMethod)) {
      // עדכון הסכום (החזרה)
      capitalData.currentAmounts[paymentMethod] += amount;
      capitalData.lastUpdated = new Date();
      await capitalData.save();
    }
  } catch (error) {
    console.error('שגיאה בביטול עדכון הון לאחר מחיקת הוצאה:', error);
  }
}; 