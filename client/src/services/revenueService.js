import axios from 'axios';
import { getMonthlyRevenueData as getMockMonthlyRevenueData } from './mockRevenueService';

/**
 * שירות נתוני הכנסות
 * מטפל בכל הבקשות הקשורות לדוחות הכנסה וסטטיסטיקה
 */

const API_URL = '/api';

// קבוע שקובע אם להשתמש בנתוני בדיקה או נתונים אמיתיים
const USE_MOCK_DATA = false; // שינוי ל-false כדי להשתמש בנתונים אמיתיים מה-API

/**
 * מקבל נתוני הכנסות חודשיים מלאים
 * @param {string} site - מזהה האתר (rothschild/airport)
 * @param {number} year - שנה
 * @param {number} month - חודש (1-12)
 * @returns {Object} נתוני הכנסות מלאים
 */
export const getMonthlyRevenueData = async (site, year, month) => {
  // אם משתמשים בנתוני בדיקה
  if (USE_MOCK_DATA) {
    return getMockMonthlyRevenueData(site, year, month);
  }
  
  // אחרת, פונים ל-API האמיתי
  try {
    const response = await axios.get(`${API_URL}/revenue/monthly/${site}/${year}/${month}`);
    return response.data;
  } catch (error) {
    console.error('שגיאה בקבלת נתוני הכנסות:', error);
    throw error;
  }
};

/**
 * מקבל נתוני הכנסות יומיים לחודש מסוים
 * @param {string} site - מזהה האתר
 * @param {number} year - שנה
 * @param {number} month - חודש (1-12)
 * @returns {Array} מערך של נתוני הכנסות יומיים
 */
export const getDailyRevenueData = async (site, year, month) => {
  try {
    const response = await axios.get(`${API_URL}/revenue/daily/${site}/${year}/${month}`);
    return response.data;
  } catch (error) {
    console.error('שגיאה בקבלת נתוני הכנסות יומיים:', error);
    throw error;
  }
};

/**
 * מקבל נתוני השוואה לחודשים קודמים
 * @param {string} site - מזהה האתר
 * @param {number} year - שנה
 * @param {number} month - חודש (1-12)
 * @returns {Array} מערך של נתוני השוואה
 */
export const getRevenueComparisonData = async (site, year, month) => {
  try {
    const response = await axios.get(`${API_URL}/revenue/compare/${site}/${year}/${month}`);
    return response.data;
  } catch (error) {
    console.error('שגיאה בקבלת נתוני השוואה:', error);
    throw error;
  }
};

/**
 * מקבל נתוני תפוסה לחודש מסוים
 * @param {string} site - מזהה האתר
 * @param {number} year - שנה
 * @param {number} month - חודש (1-12)
 * @returns {Array} מערך של נתוני תפוסה
 */
export const getOccupancyData = async (site, year, month) => {
  try {
    const response = await axios.get(`${API_URL}/occupancy/${site}/${year}/${month}`);
    return response.data;
  } catch (error) {
    console.error('שגיאה בקבלת נתוני תפוסה:', error);
    throw error;
  }
};

/**
 * מקבל פילוח הכנסות לפי אמצעי תשלום
 * @param {string} site - מזהה האתר
 * @param {number} year - שנה
 * @param {number} month - חודש (1-12)
 * @returns {Array} מערך של נתוני פילוח
 */
export const getPaymentMethodsData = async (site, year, month) => {
  try {
    const response = await axios.get(`${API_URL}/revenue/payment-methods/${site}/${year}/${month}`);
    return response.data;
  } catch (error) {
    console.error('שגיאה בקבלת נתוני אמצעי תשלום:', error);
    throw error;
  }
};

/**
 * מקבל נתוני הכנסות לפי חדרים
 * @param {string} site - מזהה האתר
 * @param {number} year - שנה
 * @param {number} month - חודש (1-12)
 * @returns {Array} מערך של נתוני הכנסות לפי חדרים
 */
export const getRoomRevenueData = async (site, year, month) => {
  try {
    const response = await axios.get(`${API_URL}/revenue/rooms/${site}/${year}/${month}`);
    return response.data;
  } catch (error) {
    console.error('שגיאה בקבלת נתוני הכנסות לפי חדרים:', error);
    throw error;
  }
}; 