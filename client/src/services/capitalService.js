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
 * קבלת נתוני הון מלאים
 * משלב את הנתונים ההתחלתיים עם כל ההכנסות וההוצאות מכל המתחמים
 */
export const getFullCapitalData = async () => {
  try {
    // קבלת נתוני הון בסיסיים (סכומים התחלתיים)
    const capitalData = await getCapitalData();
    
    // קבלת כל ההכנסות וההוצאות מכל המתחמים
    // כאן נדרש לבצע קריאות לשירותי הכנסות והוצאות
    // לקבלת הנתונים המלאים
    
    // חישוב הנתונים המלאים
    return calculateTotalCapital(
      capitalData.initialAmounts,
      capitalData.revenues || [],
      capitalData.expenses || []
    );
  } catch (error) {
    console.error('שגיאה בחישוב נתוני הון מלאים:', error);
    throw error;
  }
}; 