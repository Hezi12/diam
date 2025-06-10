import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://diam-loy6.onrender.com';

/**
 * שירות לטיפול בבקשות לשרתי iCount
 */
class ICountService {
  /**
   * התחברות למערכת iCount
   * @param {string} location - מזהה המתחם ('airport' או 'rothschild')
   * @param {string} [companyId] - מזהה חברה (אופציונלי, ישתמש בברירת המחדל אם לא מסופק)
   * @param {string} [username] - שם משתמש (אופציונלי, ישתמש בברירת המחדל אם לא מסופק)
   * @param {string} [password] - סיסמה (אופציונלי, ישתמש בברירת המחדל אם לא מסופק)
   * @returns {Promise<Object>} - תוצאת ההתחברות
   */
  async login(location, companyId, username, password) {
    try {
      const response = await axios.post(`${API_URL}/api/icount/login`, {
        location,
        companyId,
        username,
        password,
      });
      
      return response.data;
    } catch (error) {
      console.error('שגיאה בהתחברות ל-iCount:', error);
      throw error;
    }
  }

  /**
   * בדיקת מצב התחברות ל-iCount
   * @param {string} location - מזהה המתחם ('airport' או 'rothschild')
   * @returns {Promise<Object>} - מידע על מצב ההתחברות
   */
  async checkConnection(location) {
    try {
      const response = await axios.get(`${API_URL}/api/icount/check-connection/${location}`);
      return response.data;
    } catch (error) {
      console.error('שגיאה בבדיקת מצב התחברות ל-iCount:', error);
      throw error;
    }
  }

  /**
   * יצירת חשבונית במערכת iCount
   * @param {string} location - מזהה המתחם ('airport' או 'rothschild')
   * @param {Object} invoiceData - נתוני החשבונית
   * @returns {Promise<Object>} - תוצאות יצירת החשבונית
   */
  async createInvoice(location, invoiceData) {
    try {
      const response = await axios.post(`${API_URL}/api/icount/invoice`, {
        location,
        ...invoiceData
      });
      return response.data;
    } catch (error) {
      console.error('שגיאה ביצירת חשבונית:', error);
      throw error;
    }
  }

  /**
   * חיוב כרטיס אשראי דרך iCount (כולל יצירת חשבונית אוטומטית)
   * @param {string} location - מזהה המתחם ('airport' או 'rothschild')
   * @param {string} bookingId - מזהה ההזמנה
   * @param {number} amount - סכום לסליקה
   * @param {boolean} createInvoice - האם ליצור חשבונית (ברירת מחדל: true)
   * @returns {Promise<Object>} - תוצאות החיוב והחשבונית
   */
  async chargeCard(location, bookingId, amount, createInvoice = true) {
    try {
      console.log('🔄 שולח בקשת סליקת אשראי לשרת:', {
        location,
        bookingId,
        amount,
        createInvoice
      });

      const response = await axios.post(`${API_URL}/api/icount/charge`, {
        location,
        bookingId,
        amount,
        createInvoice
      });

      console.log('✅ תגובה מהשרת:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ שגיאה בחיוב כרטיס אשראי:', error);
      
      // טיפול בשגיאות ספציפיות
      if (error.response) {
        // שגיאה מהשרת
        const errorData = error.response.data;
        throw new Error(errorData.message || errorData.error || 'שגיאה בסליקת כרטיס אשראי');
      } else if (error.request) {
        // בעיה ברשת
        throw new Error('בעיה בחיבור לשרת');
      } else {
        // שגיאה כללית
        throw new Error(error.message || 'שגיאה לא צפויה');
      }
    }
  }

  /**
   * חיוב כרטיס ויצירת חשבונית בפעולה אחת
   * @param {string} location - מזהה המתחם ('airport' או 'rothschild')
   * @param {Object} clientData - נתוני הלקוח
   * @param {Object} paymentData - נתוני התשלום
   * @param {Object} invoiceData - נתוני החשבונית
   * @returns {Promise<Object>} - תוצאות הפעולה
   */
  async chargeAndCreateInvoice(location, clientData, paymentData, invoiceData) {
    try {
      const response = await axios.post(`${API_URL}/api/icount/charge-and-invoice`, {
        location,
        clientData,
        paymentData,
        invoiceData,
      });
      return response.data;
    } catch (error) {
      console.error('שגיאה בחיוב ויצירת חשבונית:', error);
      throw error;
    }
  }
}

export default new ICountService(); 