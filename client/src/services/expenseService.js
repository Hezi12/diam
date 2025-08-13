import axios from 'axios';
import { format } from 'date-fns';
import { getToken } from './authService';

/**
 * שירות לניהול הוצאות
 * מטפל בכל הבקשות הקשורות להוצאות (קבלה, הוספת עדכון ומחיקה)
 */

import { API_URL } from '../config/apiConfig';

const API_BASE = '/api';

// מוק זמני עד ליצירת ה-API בצד השרת
const mockExpenses = {
  // הוצאות לדוגמה לרוטשילד - חודש 7, 2023
  'rothschild-2023-7': [
    { _id: '1', amount: 6500, category: 'שכירות', description: 'שכירות חודשית', paymentMethod: 'transfer_mizrahi', date: '2023-07-01' },
    { _id: '2', amount: 850, category: 'חשמל', description: 'חשבון חשמל', paymentMethod: 'credit_rothschild', date: '2023-07-15' },
    { _id: '3', amount: 320, category: 'מים', description: 'חשבון מים', paymentMethod: 'credit_rothschild', date: '2023-07-20' },
    { _id: '4', amount: 1200, category: 'ניקיון', description: 'ניקיון שבועי', paymentMethod: 'cash', date: '2023-07-25' }
  ],
  // הוצאות לדוגמה לאור יהודה - חודש 7, 2023
  'airport-2023-7': [
    { _id: '5', amount: 8500, category: 'שכירות', description: 'שכירות חודשית', paymentMethod: 'transfer_poalim', date: '2023-07-01' },
    { _id: '6', amount: 1200, category: 'חשמל', description: 'חשבון חשמל', paymentMethod: 'credit_or_yehuda', date: '2023-07-10' },
    { _id: '7', amount: 450, category: 'מים', description: 'חשבון מים', paymentMethod: 'credit_or_yehuda', date: '2023-07-15' },
    { _id: '8', amount: 2000, category: 'משכורות', description: 'משכורת עובד 1', paymentMethod: 'bit_poalim', date: '2023-07-28' }
  ]
};

// קבוע שקובע אם להשתמש בנתוני בדיקה או נתונים אמיתיים
const USE_MOCK_DATA = false; // שימוש ב-API אמיתי במקום נתוני מוק

/**
 * קבלת הוצאות לחודש ואתר מסוימים
 * @param {string} site - מזהה האתר (rothschild/airport)
 * @param {number} year - שנה
 * @param {number} month - חודש (1-12)
 * @returns {Promise<Array>} מערך של נתוני הוצאות
 */
export const getExpenses = async (site, year, month) => {
  // במצב מוק, מחזירים נתוני דוגמה
  if (USE_MOCK_DATA) {
    const key = `${site}-${year}-${month}`;
    return mockExpenses[key] || [];
  }
  
  // אחרת, פונים ל-API האמיתי
  try {
    const token = getToken();
    const response = await axios.get(`${API_BASE}/financial/expenses`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        year,
        month,
        location: site // התאמת שם הפרמטר לפי הדרישה בשרת
      }
    });
    console.log('תגובת שרת להוצאות:', response.data);
    return response.data;
  } catch (error) {
    console.error('שגיאה בקבלת נתוני הוצאות:', error);
    throw error;
  }
};

/**
 * הוספת הוצאה חדשה
 * @param {Object} expense - פרטי ההוצאה
 * @returns {Promise<Object>} ההוצאה שנוספה עם מזהה
 */
export const addExpense = async (expense) => {
  // במצב מוק, מדמים הוספת הוצאה
  if (USE_MOCK_DATA) {
    const key = `${expense.location}-${expense.year}-${expense.month}`;
    
    // יצירת מזהה ייחודי להוצאה החדשה
    const newId = Math.random().toString(36).substr(2, 9);
    
    // הוצאה חדשה עם מזהה
    const newExpense = {
      _id: newId,
      ...expense
    };
    
    // אם ההוצאה מחולקת בין המתחמים
    if (expense.splitBetweenLocations) {
      const splitAmount = expense.amount / 2;
      
      // הוספת ההוצאה לשני המתחמים
      ['rothschild', 'airport'].forEach(location => {
        const locationKey = `${location}-${expense.year}-${expense.month}`;
        if (!mockExpenses[locationKey]) {
          mockExpenses[locationKey] = [];
        }
        
        mockExpenses[locationKey].push({
          ...newExpense,
          _id: `${newId}-${location}`,
          amount: splitAmount,
          location,
          description: `${expense.description} (חלק מ-${expense.amount}₪)`
        });
      });
      
      return newExpense;
    }
    
    // הוספה למערך ההוצאות המוק
    if (!mockExpenses[key]) {
      mockExpenses[key] = [];
    }
    
    mockExpenses[key].push(newExpense);
    
    return newExpense;
  }
  
  // אחרת, פונים ל-API האמיתי
  try {
    // אם ההוצאה מחולקת בין המתחמים
    if (expense.splitBetweenLocations) {
      const splitAmount = expense.amount / 2;
      const promises = [];
      
      // יצירת שתי הוצאות נפרדות
      ['rothschild', 'airport'].forEach(location => {
        const expenseData = {
          amount: splitAmount,
          description: `${expense.description} (חלק מ-${expense.amount}₪)`,
          date: expense.date,
          category: expense.category,
          location: location,
          paymentMethod: expense.paymentMethod,
          isRecurring: expense.isRecurring || false
        };
        
        promises.push(
          axios.post(`${API_URL}/financial/expenses`, expenseData, {
            headers: { Authorization: `Bearer ${getToken()}` }
          })
        );
      });
      
      // שליחת שתי ההוצאות במקביל
      const results = await Promise.all(promises);
      return results.map(r => r.data);
    }
    
    // התאמת נתוני ההוצאה לפורמט שהשרת מצפה לו
    const expenseData = {
      amount: Number(expense.amount),
      description: expense.description,
      date: expense.date,
      category: expense.category,
      location: expense.location,
      paymentMethod: expense.paymentMethod,
      isRecurring: expense.isRecurring || false
    };
    
    console.log('שולח נתוני הוצאה לשרת:', expenseData);
    
    const token = getToken();
    const response = await axios.post(`${API_URL}/financial/expenses`, expenseData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('תגובה מהשרת:', response.data);
    return response.data;
  } catch (error) {
    console.error('שגיאה בהוספת הוצאה:', error);
    throw error;
  }
};

/**
 * עדכון הוצאה קיימת
 * @param {string} id - מזהה ההוצאה
 * @param {Object} expense - פרטי ההוצאה המעודכנים
 * @returns {Promise<Object>} ההוצאה המעודכנת
 */
export const updateExpense = async (id, expense) => {
  // במצב מוק, מדמים עדכון הוצאה
  if (USE_MOCK_DATA) {
    // חיפוש ההוצאה בכל המערכים
    for (const key in mockExpenses) {
      const index = mockExpenses[key].findIndex(e => e._id === id);
      
      if (index !== -1) {
        // עדכון ההוצאה
        mockExpenses[key][index] = {
          ...mockExpenses[key][index],
          ...expense
        };
        
        return mockExpenses[key][index];
      }
    }
    
    throw new Error('הוצאה לא נמצאה');
  }
  
  // אחרת, פונים ל-API האמיתי
  try {
    // התאמת נתוני ההוצאה לפורמט שהשרת מצפה לו
    const expenseData = {};
    
    if (expense.amount) expenseData.amount = Number(expense.amount);
    if (expense.description) expenseData.description = expense.description;
    if (expense.date) expenseData.date = expense.date;
    if (expense.category) expenseData.category = expense.category;
    if (expense.site) expenseData.location = expense.site;
    if (expense.paymentMethod) expenseData.paymentMethod = expense.paymentMethod;
    
    const token = getToken();
    const response = await axios.put(`${API_URL}/financial/expenses/${id}`, expenseData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('שגיאה בעדכון הוצאה:', error);
    throw error;
  }
};

/**
 * מחיקת הוצאה
 * @param {string} id - מזהה ההוצאה
 * @returns {Promise<Object>} אישור המחיקה
 */
export const deleteExpense = async (id) => {
  // במצב מוק, מדמים מחיקת הוצאה
  if (USE_MOCK_DATA) {
    // חיפוש ההוצאה בכל המערכים
    for (const key in mockExpenses) {
      const index = mockExpenses[key].findIndex(e => e._id === id);
      
      if (index !== -1) {
        // מחיקת ההוצאה
        mockExpenses[key].splice(index, 1);
        
        return { success: true };
      }
    }
    
    throw new Error('הוצאה לא נמצאה');
  }
  
  // אחרת, פונים ל-API האמיתי
  try {
    const token = getToken();
    const response = await axios.delete(`${API_URL}/financial/expenses/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('שגיאה במחיקת הוצאה:', error);
    throw error;
  }
};

/**
 * הוספת הוצאות מרובות (ייבוא מאקסל)
 * @param {Array} expenses - מערך של אובייקטי הוצאה
 * @returns {Promise<Object>} תוצאת הייבוא
 */
export const addBatchExpenses = async (expenses) => {
  // במצב מוק, נשתמש בהוספת הוצאה רגילה
  if (USE_MOCK_DATA) {
    const results = [];
    for (const expense of expenses) {
      results.push(await addExpense(expense));
    }
    return results;
  }
  
  // פנייה לשרת
  try {
    const token = getToken();
    const response = await axios.post(`${API_URL}/financial/expenses/batch`, { expenses }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('תגובה מהשרת לאחר ייבוא הוצאות:', response.data);
    return response.data.expenses;
  } catch (error) {
    console.error('שגיאה בייבוא הוצאות:', error);
    throw error;
  }
}; 