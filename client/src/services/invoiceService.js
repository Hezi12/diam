import axios from 'axios';
import { API_ENDPOINTS } from '../config/apiConfig';
import errorService from './errorService';
import logService from './logService';

/**
 * שירות לניהול חשבוניות ותשלומים
 */
const invoiceService = {
  /**
   * קבלת רשימת חשבוניות
   * @param {number} page - מספר הדף לתצוגה
   * @param {number} limit - מספר פריטים בדף
   * @param {string} [sortBy='date'] - מיון לפי שדה
   * @param {string} [order='desc'] - סדר המיון (עולה/יורד)
   * @returns {Promise<Object>} רשימת החשבוניות ומידע על הדפים
   */
  getInvoices: async (page = 1, limit = 10, sortBy = 'date', order = 'desc') => {
    try {
      logService.info('מבקש רשימת חשבוניות');
      const response = await axios.get(API_ENDPOINTS.invoices.list, {
        params: { page, limit, sortBy, order }
      });
      logService.info('התקבלה רשימת חשבוניות:', response.data);
      return response.data;
    } catch (error) {
      logService.error('שגיאה בקבלת רשימת חשבוניות:', error);
      const errorInfo = errorService.handleApiError(error, 'fetch invoices');
      throw errorInfo;
    }
  },

  /**
   * קבלת פרטי חשבונית
   * @param {string} invoiceId - מזהה החשבונית
   * @returns {Promise<Object>} פרטי החשבונית
   */
  getInvoiceById: async (invoiceId) => {
    try {
      const response = await axios.get(API_ENDPOINTS.invoices.byId(invoiceId));
      return response.data;
    } catch (error) {
      const errorInfo = errorService.handleApiError(error, 'fetch invoice details');
      throw errorInfo;
    }
  },

  /**
   * יצירת חשבונית חדשה
   * @param {Object} invoiceData - פרטי החשבונית
   * @param {string|null} bookingId - מזהה ההזמנה (אופציונלי)
   * @returns {Promise<Object>} פרטי החשבונית שנוצרה
   */
  createInvoice: async (invoiceData, bookingId = null) => {
    try {
      // בדיקה שנתוני החשבונית תקינים
      if (!invoiceData) {
        throw new Error('נתוני החשבונית חסרים');
      }

      // בדיקה שפרטי הלקוח מלאים
      if (!invoiceData.customer || !invoiceData.customer.name) {
        throw new Error('פרטי הלקוח חסרים או לא תקינים');
      }

      // וידוא שיש פריטים בחשבונית
      if (!Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
        throw new Error('החשבונית חייבת לכלול לפחות פריט אחד');
      }

      const url = API_ENDPOINTS.invoices.base;
      
      // הכנת פרטי החשבונית לפי המבנה הנדרש בשרת
      const requestData = {
        invoiceData: {
          ...invoiceData,
          status: 'active' // שימוש בסטטוס תקין מתוך ה-enum של המודל
        }
      };
      
      // הוספת מזהה ההזמנה אם קיים
      if (bookingId) {
        requestData.bookingId = bookingId;
      }
      
      // תיעוד הבקשה לצורך ניפוי באגים
      logService.info(`שולח בקשה ליצירת חשבונית:`, JSON.stringify(requestData, null, 2));
      
      const response = await axios.post(url, requestData);
      
      // בדיקה שהתקבלה תשובה תקינה
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'שגיאה לא ידועה בשרת');
      }
      
      logService.info('חשבונית נוצרה בהצלחה:', response.data);
      return response.data.invoice || response.data;
    } catch (error) {
      logService.error('שגיאה ביצירת חשבונית:', error.response?.data || error.message);
      
      // שגיאת ולידציה מהשרת
      if (error.response?.data?.validationErrors) {
        const errorKeys = Object.keys(error.response.data.validationErrors);
        const errorMessage = errorKeys.length > 0 
          ? `שגיאת ולידציה: ${error.response.data.validationErrors[errorKeys[0]]}` 
          : 'שגיאת ולידציה בשרת';
        throw new Error(errorMessage);
      }
      
      const errorInfo = errorService.handleApiError(error, 'create invoice');
      throw errorInfo;
    }
  },

  /**
   * עדכון חשבונית
   * @param {string} invoiceId - מזהה החשבונית
   * @param {Object} invoiceData - פרטי החשבונית המעודכנים
   * @returns {Promise<Object>} פרטי החשבונית המעודכנת
   */
  updateInvoice: async (invoiceId, invoiceData) => {
    try {
      const response = await axios.put(API_ENDPOINTS.invoices.byId(invoiceId), invoiceData);
      return response.data;
    } catch (error) {
      const errorInfo = errorService.handleApiError(error, 'update invoice');
      throw errorInfo;
    }
  },

  /**
   * מחיקת חשבונית
   * @param {string} invoiceId - מזהה החשבונית
   * @returns {Promise<Object>} אישור המחיקה
   */
  deleteInvoice: async (invoiceId) => {
    try {
      const response = await axios.delete(API_ENDPOINTS.invoices.byId(invoiceId));
      return response.data;
    } catch (error) {
      const errorInfo = errorService.handleApiError(error, 'delete invoice');
      throw errorInfo;
    }
  },

  /**
   * עיבוד תשלום
   * @param {string} invoiceId - מזהה החשבונית
   * @param {Object} paymentData - פרטי התשלום
   * @returns {Promise<Object>} אישור התשלום
   */
  processPayment: async (invoiceId, paymentData) => {
    try {
      const response = await axios.post(API_ENDPOINTS.invoices.processPayment(invoiceId), paymentData);
      return response.data;
    } catch (error) {
      const errorInfo = errorService.handleApiError(error, 'process payment');
      throw errorInfo;
    }
  },

  /**
   * קבלת היסטוריית תשלומים של חשבונית
   * @param {string} invoiceId - מזהה החשבונית
   * @returns {Promise<Array>} היסטוריית התשלומים
   */
  getPaymentHistory: async (invoiceId) => {
    try {
      const response = await axios.get(API_ENDPOINTS.invoices.paymentHistory(invoiceId));
      return response.data;
    } catch (error) {
      const errorInfo = errorService.handleApiError(error, 'fetch payment history');
      throw errorInfo;
    }
  },

  /**
   * שליחת חשבונית במייל
   * @param {string} invoiceId - מזהה החשבונית
   * @param {string} email - כתובת המייל
   * @returns {Promise<Object>} אישור השליחה
   */
  emailInvoice: async (invoiceId, email) => {
    try {
      const response = await axios.post(API_ENDPOINTS.invoices.sendEmail(invoiceId), { email });
      return response.data;
    } catch (error) {
      const errorInfo = errorService.handleApiError(error, 'email invoice');
      throw errorInfo;
    }
  },

  /**
   * עיבוד תשלום
   * @param {string} invoiceId - מזהה החשבונית
   * @param {Object} paymentData - פרטי התשלום
   * @returns {Promise<Object>} אישור התשלום
   */
  processPayment: async (invoiceId, paymentData) => {
    try {
      const response = await axios.post(API_ENDPOINTS.invoices.processPayment(invoiceId), paymentData);
      return response.data;
    } catch (error) {
      const errorInfo = errorService.handleApiError(error, 'process payment');
      throw errorInfo;
    }
  },

  /**
   * ביטול חשבונית
   * @param {string} invoiceId - מזהה החשבונית
   * @param {string} reason - סיבת הביטול (אופציונלי)
   * @returns {Promise<Object>} - נתוני החשבונית המבוטלת
   */
  cancelInvoice: async (invoiceId, reason = '') => {
    try {
      logService.info(`מבקש לבטל חשבונית ${invoiceId}`);
      const response = await axios.patch(API_ENDPOINTS.invoices.cancel(invoiceId), { reason });
      logService.info('החשבונית בוטלה בהצלחה');
      return response.data;
    } catch (error) {
      logService.error('שגיאה בביטול חשבונית:', error);
      const errorInfo = errorService.handleApiError(error, 'cancel invoice');
      throw errorInfo;
    }
  },

  /**
   * יצירת חשבונית זיכוי
   * @param {string} invoiceId - מזהה החשבונית המקורית
   * @param {string} [reason] - סיבת הזיכוי
   * @returns {Promise<Object>} פרטי חשבונית הזיכוי
   */
  createCreditInvoice: async (invoiceId, reason) => {
    try {
      logService.info(`יוצר חשבונית זיכוי עבור חשבונית ${invoiceId}`);
      const response = await axios.post(API_ENDPOINTS.invoices.credit(invoiceId), { reason });
      logService.info('חשבונית זיכוי נוצרה בהצלחה:', response.data);
      return response.data;
    } catch (error) {
      logService.error('שגיאה ביצירת חשבונית זיכוי:', error);
      const errorInfo = errorService.handleApiError(error, 'create credit invoice');
      throw errorInfo;
    }
  },

  /**
   * קבלת מספר חשבונית הבא בסדרה
   * @returns {Promise<string>} מספר החשבונית הבא
   */
  getNextInvoiceNumber: async () => {
    try {
      logService.info('מבקש מספר חשבונית הבא');
      const response = await axios.get(API_ENDPOINTS.invoices.nextNumber);
      
      if (!response.data || !response.data.success) {
        throw new Error('שגיאה בקבלת מספר חשבונית');
      }
      
      logService.info('התקבל מספר חשבונית הבא:', response.data.nextInvoiceNumber);
      return response.data.nextInvoiceNumber;
    } catch (error) {
      logService.error('שגיאה בקבלת מספר חשבונית הבא:', error);
      const errorInfo = errorService.handleApiError(error, 'fetch next invoice number');
      throw errorInfo;
    }
  }
};

export default invoiceService; 