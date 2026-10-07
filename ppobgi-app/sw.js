// 자동 생성(scripts/build-web.mjs) — 고치지 말 것
// 같은 주소(origin)에 다른 앱(우리반 허브 등)이 있어도 이 앱·이 경로의 캐시만 만들고 지운다(R11)
const PREFIX = 'ppobgi-app ' + self.registration.scope + ' ';
const CACHE = PREFIX + "1.4.5-e07b07f4c205";
const LEGACY = /^ppobgi-\d+\.\d+\.\d+-[0-9a-f]{12}$/u; // 1.4.4까지 쓰던 이 앱의 캐시 이름
const FILES = ["./","./app-icon.png","./app-info.json","./assets/app-mark-C5JR550P.svg","./assets/chalk-arrow-Db7BmSki.svg","./assets/chalk-grain-BAjQzUMC.svg","./assets/chalk-wheel-mark-BMijhKoA.svg","./assets/course-self-engine-DeL2WiJ-.js","./assets/fonts/HiMelody-Regular.ttf","./assets/fonts/Jua-Regular.ttf","./assets/fonts/PretendardVariable.woff2","./assets/index-DFzp_4zd.js","./assets/index-DrJ8We_U.css","./assets/main-Diadnj44.js","./assets/preload-helper-B5CIiySc.js","./assets/sounds/ball_drop.ogg","./assets/sounds/fail.ogg","./assets/sounds/gamble_enter.ogg","./assets/sounds/pinball_bump.ogg","./assets/sounds/roulette_tick.ogg","./assets/sounds/timer_end.ogg","./assets/sounds/win_fanfare.ogg","./cursors/stick-green.svg","./cursors/stick-pink.svg","./cursors/stick-sky.svg","./cursors/stick-white.svg","./cursors/stick-yellow.svg","./cursors/stub-green.svg","./cursors/stub-pink.svg","./cursors/stub-sky.svg","./cursors/stub-white.svg","./cursors/stub-yellow.svg","./icons/icon-180.png","./icons/icon-192.png","./icons/icon-512.png","./index.html","./licenses/course-physics-lazygyu-MIT.txt","./licenses/HiMelody-OFL.txt","./licenses/Jua-OFL.txt","./licenses/Kenney-Music-Jingles-CC0.txt","./licenses/Kenney-Sound-Effects-CC0.txt","./licenses/matter-js-MIT.txt","./licenses/Pretendard-OFL.txt","./licenses/TIMER_AUDIO_SOURCE.md","./manifest.webmanifest"];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())); });
const OWN = key => key.startsWith(PREFIX) || LEGACY.test(key);
// 2026-10-07 건윤님 태블릿 「또르르를 준비하지 못했어요」: 새 판이 자리 잡으며 옛 캐시를 바로 지우면, 이미 열려 있던 옛 화면이 나중에 불러오는
// 조각(또르르 엔진 등)을 못 받아 계속 실패했다(재현: analysis/fix-20261007/web-stale-engine-check.mjs). 바로 앞 세대 하나는 남긴다(keys는 만든 순서)
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => {
  const older = keys.filter(key => key !== CACHE && OWN(key)), keep = older.slice(-1);
  return Promise.all(older.filter(key => !keep.includes(key)).map(key => caches.delete(key)));
}).then(() => self.clients.claim())); });
/** 이 판 캐시에 없으면 남겨 둔 앞 세대 캐시에서 찾는다(옛 화면의 옛 조각). 새 화면의 파일은 이 판 캐시에 다 있어 먼저 걸린다 */
const fromOlder = request => caches.keys().then(keys => keys.filter(key => key !== CACHE && OWN(key)).reduce((found, key) =>
  found.then(hit => hit || caches.open(key).then(cache => cache.match(request, { ignoreSearch: true }))), Promise.resolve(undefined)));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // 새 판 확인(version.json)과 다른 주소(공지·유튜브)는 늘 인터넷에서
  if (event.request.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('/version.json')) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request, { ignoreSearch: true })).then(hit => hit || fromOlder(event.request)).then(hit => hit || fetch(event.request)));
});
