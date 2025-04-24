import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// יצירת קונטקסט אימות
const AuthContext = createContext();

// פרובידר לאימות
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // בדיקה האם המשתמש מחובר (על פי טוקן ב-localStorage)
  useEffect(() => {
    const checkAuth = async () => {
      console.log('AuthContext: Checking authentication status...');
      const token = localStorage.getItem('token');
      
      if (token) {
        console.log('AuthContext: Token found in localStorage');
        // הגדרת הטוקן בכותרות הבקשה
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          // ניסיון לפענח את הטוקן
          const decoded = jwtDecode(token);
          console.log('AuthContext: Token decoded successfully', decoded);
          
          // בדיקה אם הטוקן פג תוקף
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            console.log('AuthContext: Token expired');
            // אם הטוקן פג תוקף, מנקים את ה-localStorage
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setIsAuthenticated(false);
            setUser(null);
          } else {
            console.log('AuthContext: Token valid, user authenticated');
            // אם הטוקן תקף, מעדכנים את המצב
            setIsAuthenticated(true);
            setUser(decoded);
          }
        } catch (error) {
          console.error('AuthContext: Token validation error:', error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        console.log('AuthContext: No token found in localStorage');
        setIsAuthenticated(false);
        setUser(null);
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // התחברות
  const login = async (credentials) => {
    console.log('AuthContext: Attempting login with credentials', {...credentials, password: '*****'});
    try {
      // שליחת בקשת התחברות לשרת
      const loginUrl = '/api/auth/login';
      console.log('AuthContext: Sending login request to', loginUrl);
      
      const response = await axios.post(loginUrl, credentials);
      console.log('AuthContext: Login response received', response.data);
      
      // שמירת הטוקן בלוקל סטוראג'
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      console.log('AuthContext: Token saved to localStorage');
      
      // הגדרת הטוקן בכותרות הבקשה לבקשות עתידיות
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // עדכון מצב האימות
      setIsAuthenticated(true);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      
      let errorMessage = 'אירעה שגיאה בהתחברות';
      
      if (error.response) {
        // במקרה של תשובת שגיאה מהשרת
        console.error('AuthContext: Server error response:', error.response.data);
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        // במקרה שהבקשה נשלחה אבל לא התקבלה תשובה
        console.error('AuthContext: No response received:', error.request);
        errorMessage = 'לא התקבלה תשובה מהשרת, בדוק את החיבור לאינטרנט';
      } else {
        // במקרה של שגיאה אחרת
        console.error('AuthContext: Request setup error:', error.message);
        errorMessage = 'שגיאה בהגדרת הבקשה';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // התנתקות
  const logout = () => {
    console.log('AuthContext: Logging out user');
    // הסרת הטוקן מה-localStorage
    localStorage.removeItem('token');
    
    // הסרת הטוקן מכותרות הבקשה
    delete axios.defaults.headers.common['Authorization'];
    
    // עדכון מצב האימות
    setIsAuthenticated(false);
    setUser(null);
    
    console.log('AuthContext: User logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// הוק שימושי לגישה לקונטקסט האימות
export const useAuth = () => {
  return useContext(AuthContext);
}; 