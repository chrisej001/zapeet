// Zapeet service worker — makes the app installable and shows a friendly
// screen when offline. It deliberately caches nothing: balances, orders and
// sessions must always come fresh from the network.
const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zapeet — offline</title><style>body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#1B1F3B;color:#F7F4EE;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px}p{margin:0;opacity:.7;font-size:14px}button{margin-top:12px;border:0;border-radius:10px;padding:12px 20px;background:#F2A93B;color:#1B1F3B;font-weight:600;font-size:14px}</style></head><body><h1 style="margin:0;font-size:20px">You're offline</h1><p>Check your connection and try again.</p><button onclick="location.reload()">Retry</button></body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
    ),
  );
});
