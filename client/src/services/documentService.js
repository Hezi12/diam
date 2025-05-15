/**
 * שירות ליצירת מסמכים (חשבוניות וקבלות) דרך iCount
 */

import axios from 'axios';
import { API_URL, API_ENDPOINTS } from '../config/apiConfig';

class DocumentService {
  /**
   * יצירת מסמך חדש (חשבונית/קבלה/אישור הזמנה)
   * 
   * @param {string} bookingId - מזהה ההזמנה
   * @param {string} documentType - סוג המסמך (invoice/invoice_receipt/confirmation)
   * @returns {Promise<Object>} - תוצאות יצירת המסמך
   */
  async createDocument(bookingId, documentType = 'invoice') {
    try {
      if (!bookingId) {
        throw new Error('מזהה הזמנה חסר');
      }

      const response = await axios.post(`${API_URL}${API_ENDPOINTS.documents.base}`, {
        bookingId,
        documentType
      });

      return response.data;
    } catch (error) {
      console.error('שגיאה ביצירת מסמך:', error);
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

      const response = await axios.get(`${API_URL}${API_ENDPOINTS.documents.byId(documentId)}`);
      return response.data;
    } catch (error) {
      console.error('שגיאה בקבלת מסמך:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * הורדת מסמך כ-PDF
   * 
   * @param {string} documentId - מזהה המסמך
   */
  downloadDocument(documentId) {
    if (!documentId) {
      console.error('מזהה מסמך חסר');
      return;
    }

    // פתיחת לשונית חדשה עם ה-PDF
    window.open(`${API_URL}${API_ENDPOINTS.documents.pdf(documentId)}`, '_blank');
  }

  /**
   * בדיקת חיבור ל-iCount
   * 
   * @param {string} location - מיקום (airport/rothschild)
   * @returns {Promise<Object>} - תוצאות הבדיקה
   */
  async checkICountConnection(location = 'rothschild') {
    try {
      const response = await axios.get(`${API_URL}${API_ENDPOINTS.documents.checkConnection}`, {
        params: { location }
      });
      return response.data;
    } catch (error) {
      console.error('שגיאה בבדיקת חיבור ל-iCount:', error);
      throw error.response?.data || error;
    }
  }
}

export default new DocumentService(); 