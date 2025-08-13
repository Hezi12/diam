/**
 * שירות ליצירת מסמכים (חשבוניות) דרך iCount
 */

import axios from 'axios';
import { API_ENDPOINTS } from '../config/apiConfig';

class DocumentService {
  /**
   * יצירת מסמך חדש (חשבונית מס)
   * 
   * @param {string} bookingId - מזהה ההזמנה
   * @param {string} documentType - סוג המסמך (רק invoice נתמך)
   * @param {number} amount - סכום החשבונית (אופציונלי)
   * @returns {Promise<Object>} - תוצאות יצירת המסמך
   */
  async createDocument(bookingId, documentType = 'invoice', amount = null) {
    try {
      if (!bookingId) {
        throw new Error('מזהה הזמנה חסר');
      }

      const requestData = {
        bookingId,
        documentType
      };
      
      // הוספת סכום אם סופק
      if (amount !== null && amount !== undefined) {
        requestData.amount = amount;
      }

      const response = await axios.post(API_ENDPOINTS.documents.base, requestData);

      return response.data;
    } catch (error) {
      console.error('שגיאה ביצירת מסמך:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * יצירת חשבונית עם קבלה
   * 
   * @param {string} bookingId - מזהה ההזמנה
   * @param {string} paymentMethod - אמצעי התשלום (cash, credit_card, bit, bank_transfer)
   * @param {number} amount - סכום החשבונית (אופציונלי)
   * @returns {Promise<Object>} - תוצאות יצירת החשבונית עם הקבלה
   */
  async createInvoiceWithReceipt(bookingId, paymentMethod, amount = null) {
    try {
      if (!bookingId) {
        throw new Error('מזהה הזמנה חסר');
      }

      if (!paymentMethod) {
        throw new Error('אמצעי תשלום חסר');
      }

      const requestData = {
        bookingId,
        documentType: 'invoice_receipt',
        paymentMethod
      };
      
      // הוספת סכום אם סופק
      if (amount !== null && amount !== undefined) {
        requestData.amount = amount;
      }

      const response = await axios.post(API_ENDPOINTS.documents.base, requestData);

      return response.data;
    } catch (error) {
      console.error('שגיאה ביצירת חשבונית עם קבלה:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * קבלת פרטי מסמך לפי מזהה
   * 
   * @param {string} documentId - מזהה המסמך
   * @returns {Promise<Object>} - פרטי המסמך
   */
  async getDocumentById(documentId) {
    try {
      if (!documentId) {
        throw new Error('מזהה מסמך חסר');
      }

      const response = await axios.get(API_ENDPOINTS.documents.byId(documentId));
      return response.data;
    } catch (error) {
      console.error('שגיאה בקבלת מסמך:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * בדיקת חיבור ל-iCount
   * 
   * @param {string} location - מיקום (airport/rothschild)
   * @returns {Promise<Object>} - תוצאות הבדיקה
   */
  async checkICountConnection(location = 'rothschild') {
    try {
      const response = await axios.get(API_ENDPOINTS.documents.checkConnection, {
        params: { location }
      });
      return response.data;
    } catch (error) {
      console.error('שגיאה בבדיקת חיבור ל-iCount:', error);
      throw error.response?.data || error;
    }
  }
}

const documentService = new DocumentService();
export default documentService; 