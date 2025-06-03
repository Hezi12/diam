/**
 * שירות ליצירת מסמכים (חשבוניות) דרך iCount
 */

import axios from 'axios';
import { API_URL, API_ENDPOINTS } from '../config/apiConfig';

class DocumentService {
  /**
   * יצירת מסמך חדש (חשבונית מס)
   * 
   * @param {string} bookingId - מזהה ההזמנה
   * @param {string} documentType - סוג המסמך (רק invoice נתמך)
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

const documentService = new DocumentService();
export default documentService; 