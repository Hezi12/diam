import axios from 'axios';
import { API_ENDPOINTS } from '../config/apiConfig';
import errorService from './errorService';
import logService from './logService';
import icountInvoiceService from './icountInvoiceService';

/**
 * שירות לניהול חשבוניות ותשלומים
 * גרסת מעבר - כעת משתמש ב-iCount במקום במערכת הישנה
 */

// קאש עבור מספרי חשבוניות - מאחסן את המספר האחרון שהתקבל לכל מיקום
const invoiceNumberCache = {
  airport: { number: null, timestamp: 0 },
  rothschild: { number: null, timestamp: 0 }
};

// זמן תוקף המטמון בשניות
const CACHE_TTL = 60; // תוקף של דקה

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
   * יצירת חשבונית חדשה (כעת דרך iCount)
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

      // קבלת פרטי המיקום
      const location = invoiceData.location || 'rothschild';
      
      // שימוש בשירות iCount ליצירת החשבונית
      const result = await icountInvoiceService.createInvoice(invoiceData, location, bookingId);
      
      logService.info('חשבונית נוצרה בהצלחה באמצעות iCount:', result);
      return result.invoice || result;
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
      
      // קבלת פרטי החשבונית
      const invoiceDetails = await invoiceService.getInvoiceById(invoiceId);
      
      // בדיקה אם החשבונית קשורה ל-iCount
      if (invoiceDetails.invoice && 
          invoiceDetails.invoice.externalSystem && 
          invoiceDetails.invoice.externalSystem.name === 'iCount') {
        // ביטול דרך שירות iCount
        return await icountInvoiceService.cancelInvoice(invoiceId, reason);
      }

      // טיפול בחשבוניות של המערכת הישנה
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
   * @param {string} location - המיקום (airport או rothschild)
   * @returns {Promise<string>} מספר החשבונית הבא
   */
  getNextInvoiceNumber: async (location = 'rothschild') => {
    try {
      // בדיקה אם יש ערך במטמון שעדיין בתוקף
      const cacheEntry = invoiceNumberCache[location];
      const now = Date.now();
      
      if (cacheEntry.number && (now - cacheEntry.timestamp) < CACHE_TTL * 1000) {
        logService.info(`משתמש במספר חשבונית מהמטמון למיקום ${location}:`, cacheEntry.number);
        return cacheEntry.number;
      }
      
      logService.info('מבקש מספר חשבונית הבא למיקום:', location);
      const response = await axios.get(`${API_ENDPOINTS.invoices.nextNumber}?location=${location}`);
      
      if (!response.data || !response.data.success) {
        throw new Error('שגיאה בקבלת מספר חשבונית');
      }
      
      const nextNumber = response.data.nextInvoiceNumber;
      logService.info('התקבל מספר חשבונית הבא:', nextNumber);
      
      // שמירה במטמון
      invoiceNumberCache[location] = {
        number: nextNumber,
        timestamp: now
      };
      
      return nextNumber;
    } catch (error) {
      logService.error('שגיאה בקבלת מספר חשבונית הבא:', error);
      const errorInfo = errorService.handleApiError(error, 'fetch next invoice number');
      throw errorInfo;
    }
  },

  /**
   * העברת חשבונית מהמערכת הישנה ל-iCount
   * @param {string} invoiceId - מזהה החשבונית 
   * @param {string} location - מיקום (airport או rothschild)
   * @returns {Promise<Object>} - תוצאת המיגרציה
   */
  migrateInvoiceToICount: async (invoiceId, location = 'rothschild') => {
    try {
      logService.info(`מעביר חשבונית ${invoiceId} למערכת iCount`);
      const response = await axios.post(`${API_ENDPOINTS.icount.base}/migrate-invoice/${invoiceId}`, { location });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'שגיאה לא ידועה בהעברת החשבונית');
      }
      
      return response.data;
    } catch (error) {
      logService.error('שגיאה בהעברת חשבונית ל-iCount:', error);
      const errorInfo = errorService.handleApiError(error, 'migrate invoice to iCount');
      throw errorInfo;
    }
  },

  /**
   * ביצוע מיגרציה המונית של חשבוניות ל-iCount
   * @param {string} location - מיקום (airport או rothschild)
   * @param {Date} dateFrom - תאריך התחלה (אופציונלי) 
   * @param {Date} dateTo - תאריך סיום (אופציונלי)
   * @returns {Promise<Object>} - תוצאות המיגרציה
   */
  bulkMigrateToICount: async (location = 'rothschild', dateFrom = null, dateTo = null) => {
    try {
      logService.info(`מבצע מיגרציה המונית של חשבוניות למערכת iCount (${location})`);
      
      const requestData = { location };
      
      if (dateFrom) {
        requestData.dateFrom = dateFrom;
      }
      
      if (dateTo) {
        requestData.dateTo = dateTo;
      }
      
      const response = await axios.post(`${API_ENDPOINTS.icount.base}/bulk-migrate`, requestData);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'שגיאה לא ידועה במיגרציה המונית');
      }
      
      return response.data;
    } catch (error) {
      logService.error('שגיאה במיגרציה המונית ל-iCount:', error);
      const errorInfo = errorService.handleApiError(error, 'bulk migrate to iCount');
      throw errorInfo;
    }
  },

  /**
   * בדיקה האם חשבונית קיימת להזמנה נתונה
   * @param {string} bookingId - מזהה ההזמנה
   * @returns {Promise<Object>} - תשובה מהשרת
   */
  checkBookingInvoice: async (bookingId) => {
    try {
      if (!bookingId) {
        throw new Error('מזהה הזמנה חסר');
      }
      
      const response = await axios.get(`${API_ENDPOINTS.invoices.base}/check-booking/${bookingId}`);
      
      return response.data;
    } catch (error) {
      logService.error('שגיאה בבדיקת קיום חשבונית:', error);
      throw error;
    }
  }
};

export default invoiceService; 