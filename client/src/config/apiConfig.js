/**
 * הגדרות API של האפליקציה
 */

// בדיקה אם האפליקציה רצה בסביבת פיתוח מקומית או על שרת מרוחק
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1';

// כתובות בסיס לשרת ה-API
const API_URLS = {
  development: 'http://localhost:3200',
  production: 'https://diam-loy6.onrender.com'
};

// בחירת הכתובת בהתאם לסביבה
const API_URL = isLocalhost 
  ? API_URLS.development
  : API_URLS.production;

// מבנה נתיבי ה-API
const API_ENDPOINTS = {
  // נתיבי אימות
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
  },
  
  // נתיבי הזמנות
  bookings: {
    base: '/api/bookings',
    byId: (id) => `/api/bookings/${id}`,
    dateRange: '/api/bookings/date-range',
    search: '/api/bookings/search',
  },
  
  // נתיבי חדרים
  rooms: {
    byLocation: (location) => `/api/rooms/location/${location}`,
    checkAvailability: '/api/rooms/check-availability',
    gallery: (location) => `/api/rooms/gallery/${location}`,
  },
  
  // נתיבי חשבוניות
  invoices: {
    base: '/api/invoices',
    list: '/api/invoices',
    byId: (id) => `/api/invoices/${id}`,
    nextNumber: '/api/invoices/next-number',
    pdf: (id) => `/api/invoices/${id}/pdf`,
    cancel: (id) => `/api/invoices/${id}/cancel`,
    credit: (id) => `/api/invoices/${id}/credit`,
    sendEmail: (id) => `/api/invoices/${id}/send-email`,
    paymentHistory: (id) => `/api/invoices/${id}/payment-history`,
    processPayment: (id) => `/api/invoices/${id}/process-payment`,
  }
};

export { API_URL, API_ENDPOINTS }; 