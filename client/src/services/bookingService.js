import axios from 'axios';
import { format } from 'date-fns';
import { API_ENDPOINTS } from '../config/apiConfig';
import errorService from './errorService';
import logService from './logService';

/**
 * שירות המספק פונקציות לניהול הזמנות וחדרים
 */
const bookingService = {
  /**
   * קבלת רשימת הזמנות לפי טווח תאריכים ומיקום
   * @param {Date} startDate - תאריך התחלה
   * @param {Date} endDate - תאריך סיום
   * @param {string} location - מיקום ההזמנות (airport/rothschild)
   * @returns {Promise<Array>} רשימת ההזמנות בטווח התאריכים
   */
  getBookingsByDateRange: async (startDate, endDate, location) => {
    try {
      // פורמט תאריכים לשליחה ל-API
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');
      
      const response = await axios.get(API_ENDPOINTS.bookings.dateRange, {
        params: {
          startDate: startStr,
          endDate: endStr,
          location
        }
      });
      
      return response.data;
    } catch (error) {
      const errorInfo = errorService.handleApiError(error, 'fetch bookings by date range');
      throw errorInfo;
    }
  },

  /**
   * חיפוש הזמנות
   * @param {string} query - מחרוזת החיפוש (אופציונלי אם יש טווח תאריכים)
   * @param {string} location - מיקום ההזמנות (airport/rothschild)
   * @param {string} startDate - תאריך התחלה לחיפוש (אופציונלי)
   * @param {string} endDate - תאריך סיום לחיפוש (אופציונלי)
   * @returns {Promise<Array>} תוצאות החיפוש
   */
  searchBookings: async (query, location, startDate = null, endDate = null) => {
    try {
      // הכנת פרמטרים לחיפוש
      const params = { location };
      
      // הוספת פרמטר חיפוש טקסטואלי אם קיים
      if (query && query.trim()) {
        params.query = query;
      }
      
      // הוספת פרמטרים של טווח תאריכים אם נשלחו
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      
      // תיעוד הפרמטרים לבדיקה
      logService.debug('שליחת בקשת חיפוש הזמנות', params);
      
      const response = await axios.get(API_ENDPOINTS.bookings.search, {
        params
      });
      
      logService.debug(`התקבלו ${response.data.length} תוצאות חיפוש`);
      return response.data;
    } catch (error) {
      const errorInfo = errorService.handleApiError(error, 'search bookings');
      throw errorInfo;
    }
  },

  /**
   * קבלת הזמנה לפי מזהה
   * @param {string} bookingId - מזהה ההזמנה
   * @returns {Promise<Object>} פרטי ההזמנה
   */
  getBookingById: async (bookingId) => {
    try {
      const response = await axios.get(API_ENDPOINTS.bookings.byId(bookingId));
      return response.data;
    } catch (error) {
      const errorInfo = errorService.handleApiError(error, 'fetch booking details');
      throw errorInfo;
    }
  },

  /**
   * יצירת הזמנה חדשה
   * @param {Object} bookingData - פרטי ההזמנה
   * @returns {Promise<Object>} פרטי ההזמנה החדשה
   */
  createBooking: async (bookingData) => {
    try {
      const response = await axios.post(API_ENDPOINTS.bookings.base, bookingData);
      return response.data;
    } catch (error) {
      const errorInfo = errorService.handleApiError(error, 'create booking');
      throw errorInfo;
    }
  },

  /**
   * עדכון הזמנה קיימת
   * @param {string} bookingId - מזהה ההזמנה
   * @param {Object} bookingData - פרטי ההזמנה המעודכנים
   * @returns {Promise<Object>} פרטי ההזמנה המעודכנת
   */
  updateBooking: async (bookingId, bookingData) => {
    try {
      const response = await axios.put(API_ENDPOINTS.bookings.byId(bookingId), bookingData);
      return response.data;
    } catch (error) {
      const errorInfo = errorService.handleApiError(error, 'update booking');
      throw errorInfo;
    }
  },

  /**
   * מחיקת הזמנה
   * @param {string} bookingId - מזהה ההזמנה
   * @returns {Promise<Object>} אישור המחיקה
   */
  deleteBooking: async (bookingId) => {
    try {
      const response = await axios.delete(API_ENDPOINTS.bookings.byId(bookingId));
      return response.data;
    } catch (error) {
      const errorInfo = errorService.handleApiError(error, 'delete booking');
      throw errorInfo;
    }
  },

  /**
   * קבלת רשימת חדרים לפי מיקום
   * @param {string} location - מיקום החדרים (airport/rothschild)
   * @returns {Promise<Array>} רשימת החדרים
   */
  getRoomsByLocation: async (location) => {
    try {
      const response = await axios.get(API_ENDPOINTS.rooms.byLocation(location));
      return response.data;
    } catch (error) {
      const errorInfo = errorService.handleApiError(error, 'fetch rooms by location');
      throw errorInfo;
    }
  },

  /**
   * בדיקת זמינות חדר
   * @param {string} roomId - מזהה החדר
   * @param {Date} checkIn - תאריך צ'ק-אין
   * @param {Date} checkOut - תאריך צ'ק-אאוט
   * @param {string} [bookingId] - מזהה הזמנה (אופציונלי, למקרה של עדכון)
   * @returns {Promise<boolean>} האם החדר זמין (true) או לא (false)
   */
  checkRoomAvailability: async (roomId, checkIn, checkOut, bookingId = null) => {
    try {
      const checkInStr = format(checkIn, 'yyyy-MM-dd');
      const checkOutStr = format(checkOut, 'yyyy-MM-dd');
      
      const response = await axios.get(API_ENDPOINTS.rooms.checkAvailability, {
        params: {
          roomId,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          bookingId
        }
      });
      
      return response.data.isAvailable;
    } catch (error) {
      const errorInfo = errorService.handleApiError(error, 'check room availability');
      throw errorInfo;
    }
  }
};

export default bookingService; 