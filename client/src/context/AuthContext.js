import React, { createContext, useContext, useState, useEffect } from 'react';

// יצירת קונטקסט אימות
const AuthContext = createContext();

// פרובידר לאימות
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // בדיקה האם המשתמש מחובר (לדוגמה בלבד)
  useEffect(() => {
    // כאן בדרך כלל היינו עושים בקשת API כדי לבדוק אם יש למשתמש סשן תקף
    // לצורך הדוגמה, אנחנו פשוט מניחים שהמשתמש מחובר
    setIsAuthenticated(true);
    setLoading(false);
  }, []);

  // התחברות
  const login = async (email, password) => {
    // כאן בדרך כלל היינו שולחים בקשת API להתחברות
    setIsAuthenticated(true);
    return true;
  };

  // התנתקות
  const logout = () => {
    // כאן בדרך כלל היינו שולחים בקשת API להתנתקות
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// הוק שימושי לגישה לקונטקסט האימות
export const useAuth = () => {
  return useContext(AuthContext);
}; 