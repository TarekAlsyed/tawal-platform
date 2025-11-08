/*
 * Service Worker (sw.js) for Tawal Academy
 * v1.24 (Cache Busting v24 - Add Activity Logging)
 */

const CACHE_NAME = 'tawal-academy-cache-v24'; // (تغيير هام لإجبار التحديث)
const DATA_CACHE_NAME = 'tawal-data-cache-v10';
const FONT_CACHE = 'tawal-fonts-cache-v1';

// (هام جداً: تأكد أن هذا هو اسم المستودع الصحيح)
const BASE_PATH = '/tawal-platform/'; 

// (تغيير هام) تحديث إصدارات الملفات
const CORE_FILES_TO_CACHE = [
    `${BASE_PATH}index.html`,
    `${BASE_PATH}quiz.html`,
    `${BASE_PATH}summary.html`,
    `${BASE_PATH}dashboard.html`,
    `${BASE_PATH}control_panel.html`,
    `${BASE_PATH}style.css?v=1.9`, 
    `${BASE_PATH}app.js?v=10.1.0`,       // (تحديث الإصدار)
    `${BASE_PATH}control_panel.js?v=1.1.0`
];

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap';

// 1. التثبيت (Install)
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME).then((cache) => {
                console.log('SW: Caching core files (v24)...');
                return cache.addAll(CORE_FILES_TO_CACHE);
            }),
            caches.open(FONT_CACHE).then((cache) => {
                return cache.add(FONT_URL);
            })
        ]).then(() => self.skipWaiting())
    );
});

// 2. التفعيل (Activate)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // سيقوم بحذف كل الكاش القديم (v23, v22... إلخ)
                    if (cacheName !== CACHE_NAME && cacheName !== FONT_CACHE && cacheName !== DATA_CACHE_NAME) {
                        console.log('SW: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. جلب البيانات (Fetch)
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // استراتيجية الخطوط: Cache first
    if (requestUrl.href === FONT_URL) {
        event.respondWith(
            caches.match(event.request, { cacheName: FONT_CACHE }).then((response) => {
                return response || fetch(event.request).then((networkResponse) => {
                    caches.open(FONT_CACHE).then((cache) => cache.put(event.request, networkResponse.clone()));
                    return networkResponse;
                });
            })
        );
        return;
    }
    
    // استراتيجية ملفات البيانات (data_*.json): Network first
    if (requestUrl.pathname.includes('/data_') && requestUrl.pathname.endsWith('.json')) {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then((cache) => {
                return fetch(event.request).then((networkResponse) => {
                    // إذا نجح، حدث الكاش
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                }).catch(() => {
                    // إذا فشل (مثل الأوفلاين)، ابحث في الكاش
                    return cache.match(event.request);
                });
            })
        );
        return;
    }

    // استراتيجية الملفات الأساسية (Core files): Cache first
    event.respondWith(
        caches.match(event.request, { cacheName: CACHE_NAME }).then((response) => {
            return response || fetch(event.request);
        })
    );
});
