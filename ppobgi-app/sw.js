// 자동 생성(scripts/build-web.mjs) — 고치지 말 것
const CACHE = "ppobgi-1.3.1-3ac7b2c0bf18";
const FILES = ["./","./app-icon.png","./app-info.json","./assets/app-mark-ptt0DDdq.svg","./assets/Box2D-na7G5dP0.wasm","./assets/chalk-grain-BAjQzUMC.svg","./assets/course-engine-browser--Sx83qsb.js","./assets/course-physics-ClyYlbEZ.js","./assets/fonts/HiMelody-Regular.ttf","./assets/fonts/Jua-Regular.ttf","./assets/index-BUutumeS.css","./assets/index-CNJnFC39.js","./assets/main-DgcO0jda.js","./assets/preload-helper-iTz4qNQB.js","./assets/sounds/ball_drop.ogg","./assets/sounds/fail.ogg","./assets/sounds/gamble_enter.ogg","./assets/sounds/pinball_bump.ogg","./assets/sounds/roulette_tick.ogg","./assets/sounds/timer_end.ogg","./assets/sounds/win_fanfare.ogg","./cursors/stick-green.svg","./cursors/stick-pink.svg","./cursors/stick-sky.svg","./cursors/stick-white.svg","./cursors/stick-yellow.svg","./cursors/stub-green.svg","./cursors/stub-pink.svg","./cursors/stub-sky.svg","./cursors/stub-white.svg","./cursors/stub-yellow.svg","./icons/icon-180.png","./icons/icon-192.png","./icons/icon-512.png","./index.html","./licenses/box2d-wasm-Zlib.txt","./licenses/course-physics-lazygyu-MIT.txt","./licenses/HiMelody-OFL.txt","./licenses/Jua-OFL.txt","./licenses/Kenney-Music-Jingles-CC0.txt","./licenses/Kenney-Sound-Effects-CC0.txt","./licenses/TIMER_AUDIO_SOURCE.md","./manifest.webmanifest"];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // 새 판 확인(version.json)과 다른 주소(공지·유튜브)는 늘 인터넷에서
  if (event.request.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('/version.json')) return;
  event.respondWith(caches.match(event.request, { ignoreSearch: true }).then(hit => hit || fetch(event.request)));
});
