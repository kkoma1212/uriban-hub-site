export function parseAppLink(value) {
  if (!value || value.version !== 1 || !["preview", "paused", "fixed"].includes(value.mode))
    throw new Error("INVALID_LINK");
  if (value.mode === "paused") throw new Error("PAUSED");
  const url = new URL(value.url);
  const allowed = value.mode === "preview"
    ? /^(?!api\.)[a-z0-9-]+\.trycloudflare\.com$/.test(url.hostname)
    : url.hostname === "app.uribanhub.com";
  if (!allowed || url.protocol !== "https:" || url.username || url.password || url.port ||
      url.pathname !== "/login" || url.search || url.hash)
    throw new Error("INVALID_LINK");
  if (!Number.isFinite(Date.parse(value.updatedAt))) throw new Error("INVALID_LINK");
  return { url: url.href, updatedAt: value.updatedAt };
}

export async function loadAppLink(fetchResponse = globalThis.fetch) {
  const url = new URL("../app-link.json", import.meta.url);
  url.searchParams.set("v", String(Date.now()));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetchResponse(url, {
      cache: "no-store", credentials: "omit", redirect: "error", signal: controller.signal,
    });
    if (!response.ok) throw new Error("LINK_UNAVAILABLE");
    return parseAppLink(await response.json());
  } finally { clearTimeout(timer); }
}

export async function openApp({ load = loadAppLink, navigate, report, finish = () => {} }) {
  report("최신 접속 주소를 확인하고 있어요.");
  try {
    const link = await load();
    navigate(link.url);
  } catch (error) {
    report(error.message === "PAUSED"
      ? "공개 체험 연결을 잠시 쉬고 있어요. 잠시 뒤 다시 확인해 주세요."
      : "접속 주소를 확인하지 못했어요. 잠시 뒤 다시 눌러 주세요.");
  } finally { finish(); }
}

if (typeof document !== "undefined") {
  const statuses = document.querySelectorAll("[data-app-link-status]");
  const report = (message) => statuses.forEach((element) => { element.textContent = message; });
  let opening = false;
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) report("");
  });
  document.querySelectorAll("[data-app-entry]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (opening) return;
      opening = true;
      link.setAttribute("aria-busy", "true");
      openApp({
        // 약관·개인정보처리방침 링크는 같은 최신 앱 주소의 /legal/ 화면으로 연다.
        navigate: (url) => {
          const path = link.dataset.appEntryPath;
          window.location.assign(path && path.startsWith("/legal/") ? new URL(path, url).href : url);
        },
        report,
        finish: () => { opening = false; link.removeAttribute("aria-busy"); },
      });
    });
  });
  const updated = document.querySelector("[data-link-updated]");
  if (updated) {
    loadAppLink().then((link) => {
      updated.textContent = "주소 확인: " + new Date(link.updatedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) + " (한국 시간)";
      report("아래 버튼으로 최신 앱 주소를 열 수 있어요.");
    }).catch((error) => report(error.message === "PAUSED"
      ? "공개 체험 연결을 잠시 쉬고 있어요. 잠시 뒤 다시 확인해 주세요."
      : "접속 주소를 확인하지 못했어요. 잠시 뒤 다시 눌러 주세요."));
  }
}
