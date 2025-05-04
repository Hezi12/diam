/**
 * שירות לניהול לוגים באפליקציה
 * מאפשר להגדיר אם לוגים יוצגו (למשל, רק בסביבת פיתוח)
 */
const logService = {
  // האם להציג לוגים (שווה ל-true בסביבת פיתוח, false בייצור)
  isEnabled: process.env.NODE_ENV === 'development',
  
  // זמן מינימלי בין לוגים מאותו סוג (במילישניות)
  throttleTime: 2000,
  
  // אחסון זמני השליחה האחרונים לפי מפתח הודעה
  lastLogTimes: {},

  /**
   * פונקציית עזר לבדיקה אם מותר לשלוח לוג (מניעת ריבוי לוגים מאותו סוג)
   * @param {string} key - מפתח ייחודי ללוג
   * @returns {boolean} - האם מותר לשלוח את הלוג
   */
  shouldLog: function(key) {
    const now = Date.now();
    const lastTime = this.lastLogTimes[key] || 0;
    
    // בדיקה אם עבר מספיק זמן מהלוג האחרון מאותו סוג
    if (now - lastTime < this.throttleTime) {
      return false;
    }
    
    // עדכון זמן הלוג האחרון
    this.lastLogTimes[key] = now;
    return true;
  },

  /**
   * רישום הודעת מידע
   * @param {...any} args - פרמטרים להצגה
   */
  info: (...args) => {
    if (logService.isEnabled) {
      // בניית מפתח ייחודי מהפרמטר הראשון (טקסט ההודעה)
      const key = typeof args[0] === 'string' ? args[0] : 'info_log';
      
      if (logService.shouldLog(key)) {
        console.log(...args);
      }
    }
  },

  /**
   * רישום הודעת שגיאה
   * @param {...any} args - פרמטרים להצגה
   */
  error: (...args) => {
    if (logService.isEnabled) {
      // שגיאות תמיד מוצגות ללא השהייה
      console.error(...args);
    }
  },

  /**
   * רישום הודעת אזהרה
   * @param {...any} args - פרמטרים להצגה
   */
  warn: (...args) => {
    if (logService.isEnabled) {
      const key = typeof args[0] === 'string' ? args[0] : 'warn_log';
      
      if (logService.shouldLog(key)) {
        console.warn(...args);
      }
    }
  },

  /**
   * רישום הודעת ניפוי באגים
   * @param {...any} args - פרמטרים להצגה
   */
  debug: (...args) => {
    if (logService.isEnabled) {
      const key = typeof args[0] === 'string' ? args[0] : 'debug_log';
      
      if (logService.shouldLog(key)) {
        console.debug(...args);
      }
    }
  },

  /**
   * הפעלה/כיבוי של הלוגים
   * @param {boolean} enabled - האם להפעיל לוגים
   */
  setEnabled: (enabled) => {
    logService.isEnabled = enabled;
  },
  
  /**
   * שינוי זמן ההשהייה בין לוגים
   * @param {number} ms - זמן במילישניות
   */
  setThrottleTime: (ms) => {
    logService.throttleTime = ms;
  },
  
  /**
   * ניקוי היסטוריית הלוגים
   */
  clearLogHistory: () => {
    logService.lastLogTimes = {};
  }
};

export default logService; 