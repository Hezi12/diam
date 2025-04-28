import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { API_URL } from './config/apiConfig';
import logService from './services/logService';
import { SnackbarProvider } from 'notistack';

// הגדרת ברירת מחדל של axios לשרת
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

logService.info('API URL:', API_URL);

// וידוא שלא יהיו כפילויות של "/api" בנתיבים של קריאות ה-API
axios.interceptors.request.use(config => {
  // בדיקת חיבור לשרת לפני כל בקשה
  
  // בדיקה אם ה-URL כבר מכיל כתובת מלאה (עם פרוטוקול)
  if (config.url && (config.url.startsWith('http://') || config.url.startsWith('https://'))) {
    // אם כן, לא נשנה את הכתובת כלל
    logService.info(`Sending request to full URL: ${config.url}`);
    return config;
  }
  
  // פישוט ההיגיון: נוסיף /api אם הוא חסר בנתיב
  if (config.url && !config.url.startsWith('/api/')) {
    config.url = '/api' + (config.url.startsWith('/') ? config.url : '/' + config.url);
  }
  
  logService.info(`Sending request to: ${axios.defaults.baseURL}${config.url}`);
  return config;
});

// אם יש טוקן בלוקל סטורג', הוסף אותו לכותרות
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  logService.info('Found token in localStorage, adding to request headers');
} else {
  logService.info('No token found in localStorage');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SnackbarProvider 
          maxSnack={3} 
          autoHideDuration={3000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <App />
        </SnackbarProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);