import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import reportWebVitals from './reportWebVitals';

// הגדרת ברירת מחדל של axios לשרת המקומי
// שימוש במשתנה הסביבה אם הוא קיים, אחרת נשתמש בכתובת קבועה
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3200';

// וידוא שלא יהיו כפילויות של "/api" בנתיבים של קריאות ה-API
axios.interceptors.request.use(config => {
  // אם ה-baseURL כבר מכיל "/api" וגם נתיב הבקשה מתחיל ב-"/api", נסיר את ה-"/api" מנתיב הבקשה
  if (config.url && config.url.startsWith('/api/') && 
      axios.defaults.baseURL.endsWith('/api')) {
    config.url = config.url.replace('/api/', '/');
  }
  return config;
});

// אם יש טוקן בלוקל סטורג', הוסף אותו לכותרות
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals(); 