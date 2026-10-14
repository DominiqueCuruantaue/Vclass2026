/**
 * VClass — Service Worker (acesso offline às Transferências)
 *
 * Os vídeos e livros transferidos já ficam no IndexedDB do dispositivo
 * (ver /static/offline.js). O que faltava para os abrir sem dados móveis era
 * a própria página: a app (Capacitor) e o browser carregam o HTML/JS do
 * servidor, por isso sem rede nem /transfers.html chegava a abrir.
 *
 * Este SW guarda em cache só o necessário para ver o conteúdo transferido:
 *   - /transfers.html e /lesson.html (o leitor de vídeo, que já reconstrói a
 *     lição a partir da cópia offline quando a API falha);
 *   - os scripts/estilos de que essas páginas dependem (próprios e de CDN).
 * Sem rede, qualquer outra página redirecciona para /transfers.html.
 * Pedidos /api/* nunca passam pela cache.
 */
const CACHE = 'vclass-offline-v1';

// Páginas que funcionam sem rede. Chave da cache sem query string
// (/lesson.html?id=... usa sempre a mesma entrada).
const OFFLINE_PAGES = ['/transfers.html', '/lesson.html'];

const SAME_ORIGIN_ASSETS = [
  '/static/app.js',
  '/static/offline.js',
  '/static/safe-dom.js',
  '/static/styles.css',
  '/favicon.svg'
];

// CDN com versão fixa (imutáveis) — servidos da cache primeiro.
const CDN_CORS_ASSETS = [
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/webfonts/fa-solid-900.woff2',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/webfonts/fa-regular-400.woff2',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/webfonts/fa-brands-400.woff2',
  'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',
  'https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.min.js',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
];
// Sem cabeçalhos CORS — guardado como resposta opaca (serve para <script>).
const CDN_NO_CORS_ASSETS = ['https://cdn.tailwindcss.com'];

const CDN_HOSTS = ['cdn.jsdelivr.net', 'cdn.tailwindcss.com'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Cada recurso à parte: uma falha isolada (ex: CDN lento) não impede
    // a instalação — o que faltar é apanhado em runtime na próxima visita.
    const jobs = [
      ...OFFLINE_PAGES.map(u => cache.add(new Request(u, { credentials: 'same-origin' }))),
      ...SAME_ORIGIN_ASSETS.map(u => cache.add(u)),
      ...CDN_CORS_ASSETS.map(u => cache.add(new Request(u, { mode: 'cors' }))),
      ...CDN_NO_CORS_ASSETS.map(async u => {
        const res = await fetch(new Request(u, { mode: 'no-cors' }));
        await cache.put(u, res);
      })
    ];
    await Promise.allSettled(jobs);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('vclass-offline-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isOfflinePage(url) {
  return OFFLINE_PAGES.includes(url.pathname);
}

async function putInCache(key, response) {
  // Só guarda respostas boas (ou opacas, que não dá para inspeccionar).
  if (!response || !(response.ok || response.type === 'opaque')) return;
  const cache = await caches.open(CACHE);
  await cache.put(key, response);
}

// Rede primeiro (conteúdo sempre actualizado com ligação), cache como recurso.
async function networkFirst(request, cacheKey) {
  try {
    const res = await fetch(request);
    putInCache(cacheKey, res.clone());
    return res;
  } catch (err) {
    const cached = await caches.match(cacheKey, { ignoreSearch: true });
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  putInCache(request, res.clone());
  return res;
}

// Rede com dados mas sem resposta (saldo esgotado, sinal fraco) pode
// pendurar o pedido em vez de falhar — sem limite, a app ficaria em branco.
const NAVIGATION_TIMEOUT_MS = 12000;
function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(request).then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

async function handleNavigation(request, url) {
  if (url.pathname === '/transfers.html') {
    // Só lê dados locais — abre logo da cache e actualiza em segundo plano.
    const cached = await caches.match('/transfers.html');
    const network = fetch(request).then(res => { putInCache('/transfers.html', res.clone()); return res; });
    if (cached) { network.catch(() => {}); return cached; }
    return network;
  }

  try {
    const res = await fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS);
    if (res.status >= 500 && isOfflinePage(url)) {
      const cached = await caches.match(url.pathname);
      if (cached) return cached;
    }
    if (isOfflinePage(url)) putInCache(url.pathname, res.clone());
    return res;
  } catch (err) {
    if (isOfflinePage(url)) {
      const cached = await caches.match(url.pathname);
      if (cached) return cached;
    }
    // Sem rede numa página que precisa da API: levar o aluno ao que já tem
    // guardado no dispositivo, em vez do ecrã de erro da WebView.
    if (await caches.match('/transfers.html')) return Response.redirect('/transfers.html', 302);
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith(handleNavigation(request, url));
    return;
  }

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/static/') || url.pathname === '/favicon.svg') {
      event.respondWith(networkFirst(request, url.pathname));
    }
    return; // /api/* e o resto: sem intervenção
  }

  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request));
  }
});
