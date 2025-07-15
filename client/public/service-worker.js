// שם ה-Cache לשמירת קבצים
const CACHE_NAME = 'diam-hotel-cache-v4';

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
  
  // מתעלם מבקשות API
  if (event.request.url.includes('/api/')) {
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
      // עבור בקשות HTML, החזר את הדף מהמטמון אם קיים, אחרת נסה להביא מהרשת
      event.respondWith(
        caches.match('/')
          .then(cachedResponse => {
            if (cachedResponse) {
              // נסה להביא גרסה עדכנית מהרשת
              const fetchPromise = fetch(event.request)
                .then(networkResponse => {
                  // עדכן את המטמון עם הגרסה החדשה
                  caches.open(CACHE_NAME)
                    .then(cache => {
                      cache.put(event.request, networkResponse.clone());
                    })
                    .catch(err => console.log('שגיאה בעדכון המטמון:', err));
                  
                  return networkResponse;
                })
                .catch(() => {
                  // אם נכשל, השתמש בגרסה מהמטמון
                  return cachedResponse;
                });
              
              // החזר מהמטמון תוך כדי ניסיון להביא מהרשת
              return cachedResponse;
            }
            
            // אם אין במטמון, נסה להביא מהרשת
            return fetch(event.request);
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

// האזנה להודעות מהקליינט והעברה לכל הלקוחות
self.addEventListener('message', event => {
  console.log('Service Worker קיבל הודעה:', event.data);
  
  if (event.data && event.data.type === 'REFRESH_GUESTS_REQUEST') {
    // העברת ההודעה לכל הקליינטים הפתוחים
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'REFRESH_GUESTS_REQUEST',
          timestamp: event.data.timestamp
        });
      });
    });
  }
}); 