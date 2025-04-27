import logService from './logService';

/**
 * שירות לטיפול אחיד בשגיאות באפליקציה
 */
const errorService = {
  /**
   * טיפול בשגיאות רשת (API) והפיכתן למבנה אחיד
   * @param {Error} error - שגיאה שהתקבלה מ-axios או מקור אחר
   * @param {string} operation - תיאור הפעולה שנכשלה (למשל "קבלת הזמנות")
   * @returns {Object} אובייקט שגיאה מובנה עם מידע רלוונטי
   */
  handleApiError: (error, operation) => {
    let errorInfo = {
      message: 'אירעה שגיאה לא צפויה',
      code: 'UNKNOWN_ERROR',
      status: null,
      originalError: error,
      details: null
    };

    // בדיקה אם מדובר בשגיאת axios (עם תשובה מהשרת)
    if (error.response) {
      const { status, data } = error.response;
      errorInfo = {
        ...errorInfo,
        status,
        message: data.message || `שגיאה ${status}`,
        code: data.code || `SERVER_ERROR_${status}`,
        details: data
      };
      
      // טיפול בסוגי שגיאות נפוצים
      if (status === 401) {
        errorInfo.code = 'UNAUTHORIZED';
        errorInfo.message = 'אינך מורשה לבצע פעולה זו, אנא התחבר מחדש';
      } else if (status === 403) {
        errorInfo.code = 'FORBIDDEN';
        errorInfo.message = 'אין לך הרשאות מתאימות לפעולה זו';
      } else if (status === 404) {
        errorInfo.code = 'NOT_FOUND';
        errorInfo.message = 'המשאב המבוקש לא נמצא';
      } else if (status === 400) {
        errorInfo.code = 'BAD_REQUEST';
        // השארת ההודעה מהשרת
      } else if (status >= 500) {
        errorInfo.code = 'SERVER_ERROR';
        errorInfo.message = 'שגיאה בשרת, אנא נסה שוב מאוחר יותר';
      }
    } 
    // בדיקה אם הבקשה נשלחה אך לא התקבלה תשובה
    else if (error.request) {
      errorInfo = {
        ...errorInfo,
        code: 'NETWORK_ERROR',
        message: 'לא ניתן להתחבר לשרת, בדוק את החיבור לאינטרנט',
        details: { request: error.request }
      };
    } 
    // שגיאות אחרות (למשל בהגדרת הבקשה)
    else {
      errorInfo = {
        ...errorInfo,
        code: 'REQUEST_ERROR',
        message: error.message || 'שגיאה בהגדרת הבקשה',
      };
    }

    // רישום השגיאה בלוג
    logService.error(`Error in ${operation}:`, errorInfo);

    return errorInfo;
  },

  /**
   * בדיקה אם מדובר בשגיאת תקשורת/רשת
   * @param {Object} errorInfo - מידע השגיאה שהוחזר מ-handleApiError
   * @returns {boolean} האם מדובר בשגיאת תקשורת
   */
  isNetworkError: (errorInfo) => {
    return errorInfo.code === 'NETWORK_ERROR';
  },

  /**
   * בדיקה אם מדובר בשגיאת הרשאות
   * @param {Object} errorInfo - מידע השגיאה שהוחזר מ-handleApiError
   * @returns {boolean} האם מדובר בשגיאת הרשאות
   */
  isAuthError: (errorInfo) => {
    return errorInfo.code === 'UNAUTHORIZED' || errorInfo.code === 'FORBIDDEN';
  }
};

export default errorService; 