const CACHE_NAME = 'carwash-v1.0.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;600;700;800;900&family=Outfit:wght@300;400;600;700;800;900&family=Bebas+Neue&display=swap'
];

// 설치 — 핵심 파일 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 활성화 — 이전 캐시 제거
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 네트워크 요청 가로채기 — 네트워크 우선 + 캐시 폴백
self.addEventListener('fetch', event => {
  // API 요청은 항상 네트워크
  if (event.request.url.includes('api.openweathermap.org') || 
      event.request.url.includes('maps.google.com') ||
      event.request.url.includes('map.kakao.com') ||
      event.request.url.includes('map.naver.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 정상 응답이면 캐시에 저장
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // 오프라인이면 캐시에서 응답
        return caches.match(event.request);
      })
  );
});
