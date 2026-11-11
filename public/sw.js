// 基本 Service Worker:快取靜態資源,支援一定程度的離線開啟。
// 記帳資料本身走 IndexedDB 離線佇列(見 src/lib/offlineQueue.ts),不是靠這裡快取。
//
// 策略是「網路優先、離線才用快取」。以前是「有快取就直接用」,會讓首頁和
// /_next/ 的程式檔永遠停在舊版(dev 時檔名不帶 hash,尤其嚴重),導致畫面
// 卡在「載入中」。

const CACHE_NAME = "bookkeeping-helper-v2";
const PRECACHE_URLS = ["/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只處理同源 GET,且不要碰 API / Supabase 呼叫,避免記帳資料被快取變成假離線成功。
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // 被導向(例如沒登入時 / → /login)的回應不能存在原本的網址底下,
        // 否則離線時會把登入頁當成首頁。
        if (response.ok && !response.redirected) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || Response.error()))
  );
});
