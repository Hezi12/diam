import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import reportWebVitals from './reportWebVitals';

// הגדרת ברירת מחדל של axios לשרת המקומי
// שימוש בכתובת קבועה במקום משתנה סביבה שלא מתעדכן בוורסל
const API_URL = 'https://diam-loy6.onrender.com';
console.log('API URL:', API_URL);
axios.defaults.baseURL = API_URL;

// וידוא שלא יהיו כפילויות של "/api" בנתיבים של קריאות ה-API
axios.interceptors.request.use(config => {
  // בדיקת חיבור לשרת לפני כל בקשה
  
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