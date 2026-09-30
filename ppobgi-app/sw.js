// 자동 생성(scripts/build-web.mjs) — 고치지 말 것
const CACHE = "ppobgi-1.4.4-4886b74d240d";
const FILES = ["./","./app-icon.png","./app-info.json","./assets/app-mark-C5JR550P.svg","./assets/chalk-arrow-Db7BmSki.svg","./assets/chalk-grain-BAjQzUMC.svg","./assets/chalk-wheel-mark-BMijhKoA.svg","./assets/course-self-engine-BRgAlyzy.js","./assets/fonts/HiMelody-Regular.ttf","./assets/fonts/Jua-Regular.ttf","./assets/fonts/PretendardVariable.woff2","./assets/index-DLOkVna5.js","./assets/index-U-_brhzF.css","./assets/main-DYrIJqBX.js","./assets/preload-helper-B5CIiySc.js","./assets/sounds/ball_drop.ogg","./assets/sounds/fail.ogg","./assets/sounds/gamble_enter.ogg","./assets/sounds/pinball_bump.ogg","./assets/sounds/roulette_tick.ogg","./assets/sounds/timer_end.ogg","./assets/sounds/win_fanfare.ogg","./cursors/stick-green.svg","./cursors/stick-pink.svg","./cursors/stick-sky.svg","./cursors/stick-white.svg","./cursors/stick-yellow.svg","./cursors/stub-green.svg","./cursors/stub-pink.svg","./cursors/stub-sky.svg","./cursors/stub-white.svg","./cursors/stub-yellow.svg","./icons/icon-180.png","./icons/icon-192.png","./icons/icon-512.png","./index.html","./licenses/course-physics-lazygyu-MIT.txt","./licenses/HiMelody-OFL.txt","./licenses/Jua-OFL.txt","./licenses/Kenney-Music-Jingles-CC0.txt","./licenses/Kenney-Sound-Effects-CC0.txt","./licenses/matter-js-MIT.txt","./licenses/Pretendard-OFL.txt","./licenses/TIMER_AUDIO_SOURCE.md","./manifest.webmanifest"];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // 새 판 확인(version.json)과 다른 주소(공지·유튜브)는 늘 인터넷에서
  if (event.request.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('/version.json')) return;
  event.respondWith(caches.match(event.request, { ignoreSearch: true }).then(hit => hit || fetch(event.request)));
});
