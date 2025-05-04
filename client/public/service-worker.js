// שם ה-Cache לשמירת קבצים
const CACHE_NAME = 'diam-hotel-cache-v2';

// רשימת הקבצים שיש לשמור ב-Cache
const urlsToCache = [
  '/',
  '/index.html',
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
  console.log('התקנת Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('שמירת קבצים ב-Cache');
        return cache.addAll(urlsToCache);
      })
  );
  // מבטיח שה-service worker החדש ייכנס לפעולה מיד
  self.skipWaiting();
});

// האזנה לבקשות רשת וניסיון להחזיר תוכן מה-Cache
self.addEventListener('fetch', event => {
  // מתעלם מבקשות שאינן GET
  if (event.request.method !== 'GET') return;
  
  // מתעלם מבקשות API
  if (event.request.url.includes('/api/')) {
    return;
  }

  // טיפול בקבצי סטטיים מהבילד
  const isStaticAsset = event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|ico)$/i);

  if (isStaticAsset) {
    // עבור משאבים סטטיים, ננסה קודם מהרשת ואם נכשל, ננסה מה-cache
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // עבור שאר הבקשות (בעיקר ניווט HTML), ננסה קודם מה-cache ואז מהרשת
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // בודק אם התגובה תקפה
            if (!response || response.status !== 200) {
              return response;
            }
            
            // מכין עותק של התגובה לפני שהיא נצרכת
            const responseToCache = response.clone();
            
            // מוסיף את התגובה למטמון
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            // אם הבקשה היא לדף ניווט והרשת נכשלה, חזור לדף הבית מהמטמון
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            
            console.error('שגיאה בטעינת משאב:', error);
            return new Response('שגיאת רשת', { 
              status: 503, 
              statusText: 'השירות אינו זמין' 
            });
          });
      })
  );
});

// מחיקת מטמונים ישנים בעת הפעלת Service Worker חדש
self.addEventListener('activate', event => {
  console.log('הפעלת Service Worker');
  
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('מחיקת מטמון ישן:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // מבטיח שה-service worker ישלוט בכל הלקוחות ללא המתנה
      return self.clients.claim();
    })
  );
}); 