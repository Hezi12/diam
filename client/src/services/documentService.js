/**
 * שירות ליצירת מסמכים (חשבוניות וקבלות) דרך iCount
 */

import axios from 'axios';
import { API_URL, API_ENDPOINTS } from '../config/apiConfig';

class DocumentService {
  /**
   * יצירת מסמך חדש (חשבונית/קבלה)
   * 
   * @param {string} bookingId - מזהה ההזמנה
   * @param {string} documentType - סוג המסמך (invoice/invoice_receipt)
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
   * @returns {boolean} - האם ההורדה הצליחה
   */
  downloadDocument(documentId) {
    if (!documentId) {
      console.error('מזהה מסמך חסר');
      return false;
    }

    try {
      // בדיקה ראשונית של המסמך לפני פתיחת חלון חדש
      this.getDocumentById(documentId)
        .then(response => {
          if (response && response.success) {
            // פתיחת לשונית חדשה עם ה-PDF
            const pdfUrl = `${API_URL}${API_ENDPOINTS.documents.pdf(documentId)}`;
            
            // שימוש ב-fetch לבדיקת הקישור לפני פתיחת חלון חדש
            fetch(pdfUrl, { method: 'HEAD' })
              .then(resp => {
                if (resp.ok) {
                  // פתיחת חלון רק אם הקישור תקין
                  window.open(pdfUrl, '_blank');
                } else {
                  // במקרה של שגיאה, הפנייה ישירה לחשבונית ב-iCount
                  if (response.invoice) {
                    console.log('מפנה ישירות לחשבונית iCount:', response.invoice.invoiceNumber);
                    // שימוש בפורמט לינק אחר של iCount
                    const isNumeric = /^\d+$/.test(response.invoice.invoiceNumber);
                    const cleanInvoiceNumber = isNumeric ? response.invoice.invoiceNumber : encodeURIComponent(response.invoice.invoiceNumber);
                    const icountUrl = `https://public.invoice4u.co.il/html/showdoc.aspx?doctype=inv&docnum=${cleanInvoiceNumber}`;
                    window.open(icountUrl, '_blank');
                  } else {
                    console.error('לא ניתן להוריד את המסמך:', resp.statusText);
                    alert('לא ניתן להוריד את המסמך. נסה שוב מאוחר יותר.');
                  }
                }
              })
              .catch(err => {
                console.error('שגיאה בבדיקת הקישור:', err);
                // במקרה של שגיאה, ננסה לפתוח ישירות
                window.open(pdfUrl, '_blank');
              });
          } else {
            console.error('לא נמצאו פרטי מסמך:', response);
            alert('לא ניתן למצוא את המסמך המבוקש');
          }
        })
        .catch(err => {
          console.error('שגיאה בקבלת פרטי מסמך:', err);
          // פתיחה ישירה של הקישור במקרה של שגיאה בקבלת פרטי המסמך
          window.open(`${API_URL}${API_ENDPOINTS.documents.pdf(documentId)}`, '_blank');
        });
      
      return true;
    } catch (error) {
      console.error('שגיאה בהורדת מסמך:', error);
      alert('אירעה שגיאה בהורדת המסמך');
      return false;
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

export default new DocumentService(); 