import axios from 'axios';
import logService from './logService';

const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * שירות לטיפול בחשבוניות iCount
 */
class ICountInvoiceService {
  /**
   * יצירת חשבונית במערכת iCount ושמירתה במערכת הפנימית
   * 
   * @param {Object} invoiceData - פרטי החשבונית
   * @param {string} location - מזהה המתחם ('airport' או 'rothschild')
   * @param {string} bookingId - מזהה ההזמנה (אופציונלי)
   * @returns {Promise<Object>} - פרטי החשבונית שנוצרה
   */
  async createInvoice(invoiceData, location, bookingId = null) {
    try {
      // וידוא נתונים תקינים
      if (!invoiceData) {
        throw new Error('נתוני החשבונית חסרים');
      }
      
      if (!location) {
        throw new Error('חסר מזהה מתחם (airport או rothschild)');
      }
      
      if (!invoiceData.customer || !invoiceData.customer.name) {
        throw new Error('פרטי הלקוח חסרים או לא תקינים');
      }
      
      // לוג לניפוי באגים
      logService.info(`יוצר חשבונית iCount למתחם ${location}:`, invoiceData);
      
      // בניית אובייקט הבקשה
      const requestData = {
        invoiceData: {
          ...invoiceData,
          location // הוספת מזהה המתחם לחשבונית
        }
      };
      
      // הוספת מזהה ההזמנה אם קיים
      if (bookingId) {
        requestData.bookingId = bookingId;
      }
      
      // שליחת בקשה ליצירת חשבונית
      const response = await axios.post(`${API_URL}/api/icount/create-internal-invoice`, requestData);
      
      // בדיקה שהתקבלה תשובה תקינה
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'שגיאה לא ידועה בשרת');
      }
      
      logService.info('חשבונית נוצרה בהצלחה ב-iCount:', response.data);
      
      return response.data;
    } catch (error) {
      logService.error('שגיאה ביצירת חשבונית ב-iCount:', error);
      throw error;
    }
  }
  
  /**
   * ביטול חשבונית
   * 
   * @param {string} invoiceId - מזהה החשבונית
   * @param {string} reason - סיבת הביטול
   * @returns {Promise<Object>} - תשובה מהשרת
   */
  async cancelInvoice(invoiceId, reason = '') {
    try {
      if (!invoiceId) {
        throw new Error('מזהה חשבונית חסר');
      }
      
      const response = await axios.post(`${API_URL}/api/icount/cancel-invoice/${invoiceId}`, { reason });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'שגיאה לא ידועה בשרת');
      }
      
      logService.info('חשבונית בוטלה בהצלחה:', response.data);
      
      return response.data;
    } catch (error) {
      logService.error('שגיאה בביטול חשבונית:', error);
      throw error;
    }
  }
  
  /**
   * בדיקה האם חשבונית קיימת להזמנה נתונה
   * 
   * @param {string} bookingId - מזהה ההזמנה
   * @returns {Promise<Object>} - תשובה מהשרת
   */
  async checkBookingInvoice(bookingId) {
    try {
      if (!bookingId) {
        throw new Error('מזהה הזמנה חסר');
      }
      
      const response = await axios.get(`${API_URL}/api/invoices/check-booking/${bookingId}`);
      
      return response.data;
    } catch (error) {
      logService.error('שגיאה בבדיקת קיום חשבונית:', error);
      throw error;
    }
  }
}

export default new ICountInvoiceService(); 