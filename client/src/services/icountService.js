import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

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
   * חיוב כרטיס אשראי דרך iCount
   * @param {string} location - מזהה המתחם ('airport' או 'rothschild')
   * @param {Object} paymentData - נתוני התשלום
   * @returns {Promise<Object>} - תוצאות החיוב
   */
  async chargeCard(location, paymentData) {
    try {
      const response = await axios.post(`${API_URL}/api/icount/charge`, {
        location,
        ...paymentData
      });
      return response.data;
    } catch (error) {
      console.error('שגיאה בחיוב כרטיס אשראי:', error);
      throw error;
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