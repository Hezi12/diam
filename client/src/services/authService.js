import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

/**
 * פונקציה להשגת טוקן ההרשאה מה-localStorage
 * @returns {string|null} טוקן ההרשאה או null אם אין טוקן
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * שירות המספק פונקציות לטיפול באימות והרשאות
 */
const authService = {
  /**
   * ניסיון להתחבר למערכת עם שם משתמש וסיסמה
   * @param {Object} credentials - פרטי ההתחברות
   * @param {string} credentials.username - שם המשתמש
   * @param {string} credentials.password - הסיסמה
   * @returns {Promise<Object>} תוצאת ההתחברות והמידע על המשתמש אם ההתחברות הצליחה
   */
  login: async (credentials) => {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      const { token, user } = response.data;
      
      // שמירת הטוקן בלוקל סטוראג'
      localStorage.setItem('token', token);
      
      // הגדרת הטוקן בכותרות הבקשה לבקשות עתידיות
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, user };
    } catch (error) {
      let errorMessage = 'אירעה שגיאה בהתחברות';
      
      if (error.response) {
        // במקרה של תשובת שגיאה מהשרת
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        // במקרה שהבקשה נשלחה אבל לא התקבלה תשובה
        errorMessage = 'לא התקבלה תשובה מהשרת, בדוק את החיבור לאינטרנט';
      } else {
        // במקרה של שגיאה אחרת
        errorMessage = 'שגיאה בהגדרת הבקשה';
      }
      
      return { success: false, error: errorMessage };
    }
  },

  /**
   * התנתקות מהמערכת - מסיר את הטוקן וההרשאות
   */
  logout: () => {
    // הסרת הטוקן מה-localStorage
    localStorage.removeItem('token');
    
    // הסרת הטוקן מכותרות הבקשה
    delete axios.defaults.headers.common['Authorization'];
    
    return { success: true };
  },

  /**
   * בדיקה האם המשתמש מחובר
   * @returns {Object} סטטוס האימות ומידע על המשתמש
   */
  checkAuthStatus: () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return { isAuthenticated: false, user: null };
    }
    
    try {
      // ניסיון לפענח את הטוקן
      const decoded = jwtDecode(token);
      
      // בדיקה אם הטוקן פג תוקף
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        // אם הטוקן פג תוקף, מנקים את ה-localStorage
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        return { isAuthenticated: false, user: null };
      }
      
      // אם הטוקן תקף, מחזירים את המידע
      return { isAuthenticated: true, user: decoded };
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      return { isAuthenticated: false, user: null };
    }
  },

  /**
   * הגדרת טוקן ההרשאה בכותרות הבקשות
   * @param {string} token - טוקן ההרשאה
   */
  setAuthToken: (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  },

  /**
   * עדכון סיסמא של משתמש
   * @param {Object} data - נתוני עדכון הסיסמא
   * @param {string} data.username - שם המשתמש
   * @param {string} data.newPassword - הסיסמא החדשה
   * @param {string} [data.oldPassword] - הסיסמא הישנה (אופציונלי)
   * @returns {Promise<Object>} תוצאת העדכון
   */
  changePassword: async (data) => {
    try {
      const response = await axios.post('/api/auth/change-password', data);
      return { success: true, message: response.data.message };
    } catch (error) {
      let errorMessage = 'אירעה שגיאה בעדכון הסיסמא';
      
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        errorMessage = 'לא התקבלה תשובה מהשרת, בדוק את החיבור לאינטרנט';
      }
      
      return { success: false, error: errorMessage };
    }
  }
};

export default authService; 