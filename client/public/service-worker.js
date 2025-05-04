// שם ה-Cache לשמירת קבצים
const CACHE_NAME = 'diam-hotel-cache-v1';

// רשימת הקבצים שיש לשמור ב-Cache
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/icons/favicon.ico',
  '/icons/favicon-16x16.png',
  '/icons/favicon-32x32.png',
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png',
  '/icons/apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=Assistant:wght@200;300;400;500;600;700;800&display=swap'
];

// התקנת ה-service worker וטעינת קבצים ל-Cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('שמירת קבצים ב-Cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// האזנה לבקשות רשת וניסיון להחזיר תוכן מה-Cache
self.addEventListener('fetch', event => {
  // אסטרטגיית Cache First, Network Fallback
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // אם יש תוצאה ב-Cache, החזר אותה
        if (response) {
          return response;
        }
        
        // אם אין תוצאה ב-Cache, נסה להביא מהרשת
        return fetch(event.request)
          .then(response => {
            // בדיקה שהתשובה תקינה
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // שיכפול התשובה כי response יכול להיות בשימוש רק פעם אחת
            const responseToCache = response.clone();
            
            // שמירת התשובה ב-Cache
            caches.open(CACHE_NAME)
              .then(cache => {
                // לא לשמור בקשות API
                if (!event.request.url.includes('/api/')) {
                  cache.put(event.request, responseToCache);
                }
              });
            
            return response;
          })
          .catch(error => {
            // במקרה של בעיה ברשת, ננסה להחזיר את דף הבית מה-Cache
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            console.error('Error fetching resource: ', event.request.url, error);
            return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});

// מחיקת מטמונים ישנים בעת הפעלת Service Worker חדש
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // מחיקת מטמונים ישנים
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 