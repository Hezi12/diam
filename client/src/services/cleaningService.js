import axios from 'axios';

/**
 * שירות לניהול משימות ניקיון
 */
const cleaningService = {
  /**
   * מחזיר רשימת משימות ניקיון עבור התאריכים המבוקשים
   * @param {string[]} dates - רשימת תאריכים בפורמט yyyy-MM-dd
   * @returns {Promise} - משימות ניקיון לכל תאריך
   */
  getCleaningTasks: async (dates) => {
    try {
      const response = await axios.get('/api/cleaning/tasks', {
        params: { dates: dates.join(',') }
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
   * @returns {Promise} - הזמנה מעודכנת
   */
  markRoomAsClean: async (taskId) => {
    try {
      const response = await axios.post('/api/cleaning/mark-clean', { taskId });
      return response.data;
    } catch (error) {
      console.error('שגיאה בסימון חדר כנקי:', error);
      throw error;
    }
  },

  /**
   * מסמן חדר כמלוכלך
   * @param {string} taskId - מזהה משימת הניקיון (מזהה ההזמנה)
   * @returns {Promise} - הזמנה מעודכנת
   */
  markRoomAsDirty: async (taskId) => {
    try {
      const response = await axios.post('/api/cleaning/mark-dirty', { taskId });
      return response.data;
    } catch (error) {
      console.error('שגיאה בסימון חדר כמלוכלך:', error);
      throw error;
    }
  }
};

export default cleaningService;