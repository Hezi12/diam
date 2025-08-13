/**
 * הגדרות API של האפליקציה
 */

// בדיקה אם האפליקציה רצה בסביבת פיתוח מקומית או על שרת מרוחק
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1';

// כתובות בסיס לשרת ה-API
const API_URLS = {
  development: 'http://localhost:3201',
  production: 'https://diam-loy6.onrender.com'
};

// בחירת הכתובת בהתאם לסביבה
// 🔒 בטיחות: תמיד נשתמש בשרת הענן כדי לא לדפוק את השרת הקבוע
const API_URL = API_URLS.production; // isLocalhost ? API_URLS.development : API_URLS.production;

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
    // נתיבים ציבוריים ללא אימות
    public: {
      checkAvailability: '/api/bookings/public/check-availability',
      create: '/api/bookings/public/create'
    }
  },
  
  // נתיבי חדרים
  rooms: {
    byLocation: (location) => `/api/rooms/location/${location}`,
    checkAvailability: '/api/rooms/check-availability',
    gallery: (location) => `/api/rooms/gallery/${location}`,
    // נתיבים ציבוריים ללא אימות
    public: {
      byLocation: (location) => `/api/rooms/public/location/${location}`,
      byId: (id) => `/api/rooms/public/single/${id}`,
    }
  },
  
  // נתיבי מסמכים (חשבוניות וקבלות)
  documents: {
    base: '/api/documents',
    byId: (id) => `/api/documents/${id}`,
    pdf: (id) => `/api/documents/pdf/${id}`,
    checkConnection: '/api/documents/check-connection'
  },
  
  // נתיבי iCount
  icount: {
    login: '/api/icount/login',
    checkConnection: (location) => `/api/icount/check-connection/${location}`,
    invoice: '/api/icount/invoice',
    charge: '/api/icount/charge',
    chargeAndInvoice: '/api/icount/charge-and-invoice',
    testConnection: (location) => `/api/icount/test-connection/${location}`,
    bulkMigrate: '/api/icount/bulk-migrate',
    migrateSingle: '/api/icount/migrate-single',
    migrationStatus: (location) => `/api/icount/migration-status/${location}`
  }
};

export { API_URL, API_ENDPOINTS }; 