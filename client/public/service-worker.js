// שם ה-Cache לשמירת קבצים
const CACHE_NAME = 'diam-hotel-cache-v5';

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
  // בדיקה אם הבקשה תקינה
  if (!event.request || !event.request.url || !event.request.method) {
    return;
  }

  // מתעלם מבקשות שאינן GET
  if (event.request.method !== 'GET') return;
  
  // מתעלם מבקשות API - תמיד נותן לרשת לטפל בהן
  if (event.request.url.includes('/api/')) {
    return;
  }

  // מתעלם מבקשות לרענון נתונים או פעולות דינמיות
  if (event.request.url.includes('refresh') || 
      event.request.url.includes('update') ||
      event.request.url.includes('sync') ||
      event.request.url.includes('settings') ||
      event.request.url.includes('public-notice-board') ||
      event.request.url.includes('notice-board-public') ||
      event.request.url.includes('bookings')) {
    return;
  }

  // בודק אם זו בקשת ניווט (HTML)
  const isHTMLRequest = event.request.mode === 'navigate' || 
                       (event.request.method === 'GET' && 
                        event.request.headers.get('accept') && 
                        event.request.headers.get('accept').includes('text/html'));

  // טיפול בקבצי סטטיים מהבילד
  const isStaticAsset = event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|ico|json)$/i);

  try {
    if (isStaticAsset) {
      // עבור משאבים סטטיים, ננסה קודם מהרשת ואם נכשל, ננסה מה-cache
      event.respondWith(
        fetch(event.request)
          .then(response => {
            // בדיקה שהתגובה תקינה
            if (!response || response.status !== 200) {
              return response;
            }
            
            // העתקת התגובה ושמירה במטמון
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(err => console.log('שגיאה בשמירה במטמון:', err));
            
            return response;
          })
          .catch(() => {
            return caches.match(event.request)
              .then(cachedResponse => {
                if (cachedResponse) {
                  return cachedResponse;
                }
                // אם אין תגובה במטמון, החזר דף שגיאה או הודעת שגיאה בסיסית
                if (isHTMLRequest) {
                  return caches.match('/');
                }
                return new Response('Resource not found', { status: 404 });
              });
          })
      );
    } else if (isHTMLRequest) {
      // עבור בקשות HTML דינמיות, תמיד נסה קודם מהרשת (Network First)
      event.respondWith(
        fetch(event.request)
          .then(networkResponse => {
            // אם הרשת זמינה, שמור במטמון והחזר את התגובה
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, networkResponse.clone());
                })
                .catch(err => console.log('שגיאה בשמירה במטמון:', err));
            }
            return networkResponse;
          })
          .catch(() => {
            // אם הרשת נכשלת, נסה מהמטמון
            return caches.match(event.request)
              .then(cachedResponse => {
                if (cachedResponse) {
                  return cachedResponse;
                }
                // אם אין במטמון, החזר דף בסיסי
                return caches.match('/');
              });
          })
      );
    } else {
      // עבור שאר הבקשות, השאר את ברירת המחדל של הדפדפן
      return;
    }
  } catch (error) {
    console.error('שגיאה בטיפול בבקשה:', error);
    return;
  }
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
          return null;
        })
      );
    }).then(() => {
      // מבטיח שה-service worker ישלוט בכל הלקוחות ללא המתנה
      return self.clients.claim();
    })
  );
}); 