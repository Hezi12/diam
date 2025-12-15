import axios from 'axios';

/**
 * שירות לניהול משימות ניקיון
 * כולל תמיכה בסיסמה פשוטה (8788) הנשלחת ב-header
 */
const cleaningService = {
  /**
   * מחזיר רשימת משימות ניקיון עבור התאריכים המבוקשים
   * @param {string[]} dates - רשימת תאריכים בפורמט yyyy-MM-dd
   * @param {string} password - סיסמת ניקיון (חובה: 8788 כברירת מחדל)
   * @returns {Promise} - משימות ניקיון לכל תאריך
   */
  getCleaningTasks: async (dates, password) => {
    try {
      const response = await axios.get('/api/cleaning/tasks', {
        params: { dates: dates.join(',') },
        headers: {
          'x-cleaning-password': password
        }
      });
      return response.data.tasks;
    } catch (error) {
      console.error('שגיאה בקבלת משימות ניקיון:', error);
      throw error;
    }
  },

  /**
   * מסמן חדר כנקי
   * @param {string} taskId - מזהה משימת הניקיון (מזהה ההזמנה)
   * @param {string} password - סיסמת ניקיון
   * @returns {Promise} - הזמנה מעודכנת
   */
  markRoomAsClean: async (taskId, password) => {
    try {
      const response = await axios.post(
        '/api/cleaning/mark-clean',
        { taskId },
        {
          headers: {
            'x-cleaning-password': password
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('שגיאה בסימון חדר כנקי:', error);
      throw error;
    }
  },

  /**
   * מסמן חדר כמלוכלך
   * @param {string} taskId - מזהה משימת הניקיון (מזהה ההזמנה)
   * @param {string} password - סיסמת ניקיון
   * @returns {Promise} - הזמנה מעודכנת
   */
  markRoomAsDirty: async (taskId, password) => {
    try {
      const response = await axios.post(
        '/api/cleaning/mark-dirty',
        { taskId },
        {
          headers: {
            'x-cleaning-password': password
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('שגיאה בסימון חדר כמלוכלך:', error);
      throw error;
    }
  }
};

export default cleaningService;