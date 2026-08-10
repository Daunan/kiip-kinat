/* ============================================================
   sw.js — service worker: cho phép dùng offline
   ⚠️ MỖI LẦN CẬP NHẬT NỘI DUNG PHẢI TĂNG SỐ VERSION BÊN DƯỚI
   ============================================================ */

const VERSION = 'kinat-v1';

const ASSETS = [
  './',
  './index.html',
  './css/app.css',
  './js/store.js',
  './js/data.js',
  './js/ui.js',
  './js/quiz.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './data/korean.json',
  './data/society.json',
  './data/culture.json',
  './data/politics.json',
  './data/economy.json',
  './data/law.json',
  './data/history.json',
  './data/geography.json',
  './data/advanced.json',
  './data/writing.json',
  './data/speaking.json',
  './data/funquiz.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      // addAll thất bại toàn bộ nếu 1 file lỗi → thêm từng file cho an toàn
      .then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // network-first: luôn lấy bản mới nếu có mạng, offline thì lấy cache
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
