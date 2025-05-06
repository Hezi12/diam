import axios from 'axios';
import { format } from 'date-fns';
import { getToken } from './authService';

/**
 * שירות לניהול הכנסות ידניות
 * מטפל בכל הבקשות הקשורות להכנסות ידניות (קבלה, הוספה, עדכון ומחיקה)
 */

const API_URL = '/api';

/**
 * קבלת הכנסות ידניות לחודש ואתר מסוימים
 * @param {string} site - מזהה האתר (rothschild/airport)
 * @param {number} year - שנה
 * @param {number} month - חודש (1-12)
 * @returns {Promise<Array>} מערך של נתוני הכנסות ידניות
 */
export const getManualIncomes = async (site, year, month) => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_URL}/financial/manual-income`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        year,
        month,
        location: site
      }
    });
    console.log('תגובת שרת להכנסות ידניות:', response.data);
    return response.data;
  } catch (error) {
    console.error('שגיאה בקבלת נתוני הכנסות ידניות:', error);
    throw error;
  }
};

/**
 * הוספת הכנסה ידנית חדשה
 * @param {Object} income - פרטי ההכנסה
 * @returns {Promise<Object>} ההכנסה שנוספה עם מזהה
 */
export const addManualIncome = async (income) => {
  try {
    // התאמת נתוני ההכנסה לפורמט שהשרת מצפה לו
    const incomeData = {
      amount: Number(income.amount),
      description: income.description,
      date: income.date,
      location: income.site,
      paymentMethod: income.paymentMethod,
      isRecurring: income.isRecurring || false,
      notes: income.notes || ''
    };
    
    // הוספת קטגוריה רק אם זה מזהה תקין (לא מחרוזת פשוטה)
    if (income.category && income.category.length === 24 && /^[0-9a-fA-F]{24}$/.test(income.category)) {
      incomeData.category = income.category;
    }
    
    console.log('שולח נתוני הכנסה ידנית לשרת:', incomeData);
    
    const token = getToken();
    const response = await axios.post(`${API_URL}/financial/manual-income`, incomeData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('תגובה מהשרת:', response.data);
    return response.data;
  } catch (error) {
    console.error('שגיאה בהוספת הכנסה ידנית:', error);
    throw error;
  }
};

/**
 * עדכון הכנסה ידנית קיימת
 * @param {string} id - מזהה ההכנסה
 * @param {Object} income - פרטי ההכנסה המעודכנים
 * @returns {Promise<Object>} ההכנסה המעודכנת
 */
export const updateManualIncome = async (id, income) => {
  try {
    // התאמת נתוני ההכנסה לפורמט שהשרת מצפה לו
    const incomeData = {};
    
    if (income.amount) incomeData.amount = Number(income.amount);
    if (income.description) incomeData.description = income.description;
    if (income.date) incomeData.date = income.date;
    if (income.category) incomeData.category = income.category;
    if (income.site) incomeData.location = income.site;
    if (income.paymentMethod) incomeData.paymentMethod = income.paymentMethod;
    if (income.notes) incomeData.notes = income.notes;
    
    const token = getToken();
    const response = await axios.put(`${API_URL}/financial/manual-income/${id}`, incomeData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('שגיאה בעדכון הכנסה ידנית:', error);
    throw error;
  }
};

/**
 * מחיקת הכנסה ידנית
 * @param {string} id - מזהה ההכנסה
 * @returns {Promise<Object>} אישור המחיקה
 */
export const deleteManualIncome = async (id) => {
  try {
    const token = getToken();
    const response = await axios.delete(`${API_URL}/financial/manual-income/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('שגיאה במחיקת הכנסה ידנית:', error);
    throw error;
  }
};

/**
 * קבלת קטגוריות הכנסה
 * @returns {Promise<Array>} רשימת קטגוריות הכנסה
 */
export const getIncomeCategories = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_URL}/financial/income-categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('שגיאה בקבלת קטגוריות הכנסה:', error);
    throw error;
  }
}; 