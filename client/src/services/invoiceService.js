/**
 * שירות לניהול חשבוניות ומיגרציה ל-iCount
 */

import axios from 'axios';
import { API_URL } from '../config/apiConfig';

class InvoiceService {
  /**
   * מיגרציה המונית של חשבוניות ל-iCount
   * @param {string} location - מיקום (airport/rothschild)
   * @param {Date} dateFrom - תאריך התחלה
   * @param {Date} dateTo - תאריך סיום
   * @returns {Promise<Object>} - תוצאות המיגרציה
   */
  async bulkMigrateToICount(location, dateFrom, dateTo) {
    try {
      const response = await axios.post(`${API_URL}/api/icount/bulk-migrate`, {
        location,
        dateFrom: dateFrom ? dateFrom.toISOString() : null,
        dateTo: dateTo ? dateTo.toISOString() : null
      });
      
      return response.data;
    } catch (error) {
      console.error('שגיאה במיגרציה המונית:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * מיגרציה של חשבונית בודדת ל-iCount
   * @param {string} invoiceId - מזהה החשבונית
   * @param {string} location - מיקום (airport/rothschild)
   * @returns {Promise<Object>} - תוצאות המיגרציה
   */
  async migrateInvoiceToICount(invoiceId, location) {
    try {
      const response = await axios.post(`${API_URL}/api/icount/migrate-single`, {
        invoiceId,
        location
      });
      
      return response.data;
    } catch (error) {
      console.error('שגיאה במיגרציה של חשבונית בודדת:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * קבלת רשימת חשבוניות
   * @param {Object} filters - מסנני חיפוש
   * @returns {Promise<Object>} - רשימת חשבוניות
   */
  async getInvoices(filters = {}) {
    try {
      const response = await axios.get(`${API_URL}/api/documents/list-all`, {
        params: filters
      });
      
      return response.data;
    } catch (error) {
      console.error('שגיאה בקבלת רשימת חשבוניות:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * בדיקת סטטוס מיגרציה
   * @param {string} location - מיקום (airport/rothschild)
   * @returns {Promise<Object>} - סטטוס המיגרציה
   */
  async getMigrationStatus(location) {
    try {
      const response = await axios.get(`${API_URL}/api/icount/migration-status/${location}`);
      
      return response.data;
    } catch (error) {
      console.error('שגיאה בקבלת סטטוס מיגרציה:', error);
      throw error.response?.data || error;
    }
  }
}

export default new InvoiceService(); 