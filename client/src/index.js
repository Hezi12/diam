import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import reportWebVitals from './reportWebVitals';

// הגדרת ברירת מחדל של axios לשרת
// בדיקה אם האפליקציה רצה בסביבת פיתוח מקומית או על שרת מרוחק
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

// בסביבת פיתוח מקומית נשתמש בכתובת המקומית, אחרת בשרת המרוחק
const API_URL = isLocalhost 
  ? 'http://localhost:3200' 
  : 'https://diam-loy6.onrender.com';

console.log('API URL:', API_URL);
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// וידוא שלא יהיו כפילויות של "/api" בנתיבים של קריאות ה-API
axios.interceptors.request.use(config => {
  // בדיקת חיבור לשרת לפני כל בקשה
  
  // בדיקה אם ה-URL כבר מכיל כתובת מלאה (עם פרוטוקול)
  if (config.url && (config.url.startsWith('http://') || config.url.startsWith('https://'))) {
    // אם כן, לא נשנה את הכתובת כלל
    console.log(`Sending request to full URL: ${config.url}`);
    return config;
  }
  
  // פישוט ההיגיון: נוסיף /api אם הוא חסר בנתיב
  if (config.url && !config.url.startsWith('/api/')) {
    config.url = '/api' + (config.url.startsWith('/') ? config.url : '/' + config.url);
  }
  
  console.log(`Sending request to: ${axios.defaults.baseURL}${config.url}`);
  return config;
});

// אם יש טוקן בלוקל סטורג', הוסף אותו לכותרות
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  console.log('Found token in localStorage, adding to request headers');
} else {
  console.log('No token found in localStorage');
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