/**
 * שירות לניהול לוגים באפליקציה
 * מאפשר להגדיר אם לוגים יוצגו (למשל, רק בסביבת פיתוח)
 */
const logService = {
  // האם להציג לוגים (שווה ל-true בסביבת פיתוח, false בייצור)
  isEnabled: process.env.NODE_ENV === 'development',

  /**
   * רישום הודעת מידע
   * @param {...any} args - פרמטרים להצגה
   */
  info: (...args) => {
    if (logService.isEnabled) {
      console.log(...args);
    }
  },

  /**
   * רישום הודעת שגיאה
   * @param {...any} args - פרמטרים להצגה
   */
  error: (...args) => {
    if (logService.isEnabled) {
      console.error(...args);
    }
  },

  /**
   * רישום הודעת אזהרה
   * @param {...any} args - פרמטרים להצגה
   */
  warn: (...args) => {
    if (logService.isEnabled) {
      console.warn(...args);
    }
  },

  /**
   * רישום הודעת ניפוי באגים
   * @param {...any} args - פרמטרים להצגה
   */
  debug: (...args) => {
    if (logService.isEnabled) {
      console.debug(...args);
    }
  },

  /**
   * הפעלה/כיבוי של הלוגים
   * @param {boolean} enabled - האם להפעיל לוגים
   */
  setEnabled: (enabled) => {
    logService.isEnabled = enabled;
  }
};

export default logService; 