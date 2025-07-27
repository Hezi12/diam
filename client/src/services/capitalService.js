import axios from 'axios';
import { getToken } from './authService';

// נקודת קצה לממשק ניהול ההון
const CAPITAL_ENDPOINT = '/api/capital';

/**
 * קבלת נתוני ההון העדכניים
 * מחזיר את כל נתוני ההון של העסק עבור כל אמצעי התשלום
 */
export const getCapitalData = async () => {
  try {
    const token = getToken();
    const response = await axios.get(CAPITAL_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('שגיאה בטעינת נתוני הון:', error);
    throw error;
  }
};

/**
 * עדכון סכום התחלתי לאמצעי תשלום מסוים
 * @param {string} paymentMethod - מזהה אמצעי התשלום
 * @param {number} amount - סכום התחלתי
 */
export const updateInitialAmount = async (paymentMethod, amount) => {
  try {
    const token = getToken();
    const response = await axios.post(`${CAPITAL_ENDPOINT}/initial`, {
      paymentMethod,
      amount
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('שגיאה בעדכון סכום התחלתי:', error);
    throw error;
  }
};

/**
 * קבלת היסטוריית עדכוני הון
 * מחזיר היסטוריה של כל העדכונים שנעשו לסכומים ההתחלתיים
 */
export const getCapitalHistory = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${CAPITAL_ENDPOINT}/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('שגיאה בטעינת היסטוריית הון:', error);
    throw error;
  }
};

/**
 * סנכרון נתוני הון עם הכנסות והוצאות לחודש מסוים
 * @param {number} year - שנה
 * @param {number} month - חודש (1-12)
 */
export const syncMonthlyCapital = async (year, month) => {
  try {
    const token = getToken();
    const response = await axios.post(`${CAPITAL_ENDPOINT}/sync/monthly/${year}/${month}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('שגיאה בסנכרון נתוני הון חודשיים:', error);
    throw error;
  }
};

/**
 * סנכרון מלא של נתוני הון עם כל ההכנסות וההוצאות
 */
export const syncFullCapital = async () => {
  try {
    const token = getToken();
    const response = await axios.post(`${CAPITAL_ENDPOINT}/sync/full`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('שגיאה בסנכרון מלא של נתוני הון:', error);
    throw error;
  }
};

/**
 * המרת קודי אמצעי תשלום לשמות בעברית
 * @param {string} method - קוד אמצעי תשלום
 * @returns {string} שם בעברית
 */
export const getPaymentMethodName = (method) => {
  const names = {
    transfer_poalim: 'העברה פועלים',
    credit_rothschild: 'אשראי רוטשילד',
    bit_poalim: 'ביט פועלים',
    cash: 'מזומן',
    cash2: 'מזומן2',
    bit_mizrahi: 'ביט מזרחי',
    paybox_poalim: 'פייבוקס פועלים',
    transfer_mizrahi: 'העברה מזרחי',
    paybox_mizrahi: 'פייבוקס מזרחי',
    credit_or_yehuda: 'אשראי אור יהודה',
    other: 'אחר'
  };
  
  return names[method] || method;
};

/**
 * חישוב נתוני הון כוללים מהכנסות והוצאות
 * משלב נתונים מכל המתחמים ומחשב את היתרה הנוכחית לפי אמצעי תשלום
 * @param {object} initialAmounts - סכומים התחלתיים
 * @param {array} revenues - נתוני הכנסות
 * @param {array} expenses - נתוני הוצאות 
 */
export const calculateTotalCapital = (initialAmounts, revenues, expenses) => {
  // יצירת אובייקט לאחסון התוצאות
  const capitalData = { ...initialAmounts };
  
  // הוספת הכנסות לפי אמצעי תשלום
  revenues.forEach(revenue => {
    const method = revenue.paymentMethod || revenue.name;
    if (!capitalData[method]) {
      capitalData[method] = 0;
    }
    capitalData[method] += revenue.amount || revenue.value || 0;
  });
  
  // הפחתת הוצאות לפי אמצעי תשלום
  expenses.forEach(expense => {
    const method = expense.paymentMethod;
    if (!capitalData[method]) {
      capitalData[method] = 0;
    }
    capitalData[method] -= expense.amount || 0;
  });
  
  // חישוב הסך הכל
  let total = 0;
  Object.values(capitalData).forEach(amount => {
    total += amount;
  });
  
  return {
    paymentMethods: capitalData,
    total
  };
};

/**
 * קבלת נתוני הון מלאים עם פירוט לפי אמצעי תשלום
 * משלב את הנתונים ההתחלתיים עם כל ההכנסות וההוצאות מכל המתחמים
 */
export const getFullCapitalData = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${CAPITAL_ENDPOINT}/full`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('שגיאה בחישוב נתוני הון מלאים:', error);
    throw error;
  }
}; 