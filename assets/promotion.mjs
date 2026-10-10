// 자료 완성 후 promotion.json에 유튜브 주소와 PDF·PPT·슬라이드 경로를 연결한다.
export function youtubeVideoId(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    let id;
    if (url.hostname === "youtu.be") id = url.pathname.slice(1);
    else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) {
      id = url.pathname === "/watch" ? url.searchParams.get("v") : /^\/(?:shorts|embed)\/([^/]+)\/?$/.exec(url.pathname)?.[1];
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id ?? "") ? id : null;
  } catch { return null; }
}

export function mediaUrl(value, base) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value, base);
    const origin = new URL(base).origin;
    if (url.username || url.password || !["https:", "http:"].includes(url.protocol)) return null;
    if (url.origin !== origin && url.protocol !== "https:") return null;
    return url.href;
  } catch { return null; }
}

export async function initPromotion(root) {
  const doc = root.ownerDocument;
  const videoStatus = root.querySelector("[data-video-status]");
  const deckStatus = root.querySelector("[data-deck-status]");
  let config;
  try {
    const response = await fetch(new URL("../promotion.json", import.meta.url), { cache: "no-store", credentials: "omit" });
    if (!response.ok) throw new Error("CONFIG_UNAVAILABLE");
    config = await response.json();
    if (!config || typeof config !== "object") throw new Error("INVALID_CONFIG");
  } catch {
    for (const status of [videoStatus, deckStatus]) status.textContent = "자료를 불러오지 못했어요. 잠시 후 페이지를 새로고침해 주세요.";
    return;
  }
  const base = new URL("../", import.meta.url).href;
  const id = youtubeVideoId(config.videoUrl);
  const videoFile = mediaUrl(config.videoFile, base);
  if (videoFile) {
    const player = doc.createElement("video");
    player.className = "promotion-video";
    player.setAttribute("aria-label", "우리반 허브 홍보 영상");
    player.controls = true;
    player.playsInline = true;
    player.preload = "metadata";
    player.src = videoFile;
    player.addEventListener("error", () => {
      videoStatus.textContent = "영상을 불러오지 못했어요. 아래 유튜브에서 보기 버튼으로 열어 주세요.";
      player.replaceWith(videoStatus);
    }, { once: true });
    videoStatus.replaceWith(player);
  } else if (id) {
    const choice = doc.createElement("div");
    choice.className = "promotion-empty";
    const explanation = doc.createElement("p");
    explanation.textContent = "버튼을 누르면 YouTube에 연결해 영상을 불러와요.";
    const button = doc.createElement("button");
    button.type = "button";
    button.className = "btn btn--ghost";
    button.textContent = "YouTube 영상 보기";
    choice.append(explanation, button);
    videoStatus.replaceWith(choice);
    button.addEventListener("click", () => {
      const player = doc.createElement("iframe");
      player.className = "promotion-video";
      player.title = "우리반 허브 홍보 영상";
      player.src = `https://www.youtube-nocookie.com/embed/${id}`;
      player.loading = "lazy";
      player.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      player.allowFullscreen = true;
      player.referrerPolicy = "strict-origin-when-cross-origin";
      choice.replaceWith(player);
    }, { once: true });
  } else if (config.videoUrl) {
    videoStatus.textContent = "영상 주소를 확인하고 있어요. 곧 다시 안내할게요.";
  }
  if (id) {
    const link = root.querySelector("[data-video-link]");
    link.href = `https://www.youtube.com/shorts/${id}`;
    link.hidden = false;
  }
  const presentation = config.presentation ?? {};
  if (typeof presentation.title === "string" && presentation.title.trim()) root.querySelector("[data-deck-title]").textContent = presentation.title;
  const pdf = mediaUrl(presentation.pdfUrl, base);
  const pptx = mediaUrl(presentation.pptxUrl, base);
  for (const [selector, url] of [["[data-pdf-link]", pdf], ["[data-pptx-link]", pptx]]) {
    if (!url) continue;
    const link = root.querySelector(selector);
    link.href = url;
    link.hidden = false;
  }
  const slides = Array.isArray(presentation.slides) ? presentation.slides.map((slide, i) => ({
    url: mediaUrl(typeof slide === "string" ? slide : slide?.src, base),
    alt: typeof slide?.alt === "string" ? slide.alt : `우리반 허브 소개 자료 ${i + 1}쪽`,
  })).filter(slide => slide.url) : [];
  if (!slides.length) {
    if (pdf) {
      deckStatus.hidden = true;
      const object = doc.createElement("object");
      object.type = "application/pdf";
      object.data = pdf;
      object.className = "promotion-pdf";
      object.setAttribute("aria-label", "우리반 허브 소개 자료 PDF");
      const fallback = doc.createElement("p");
      fallback.textContent = "아래 PDF 보기 버튼으로 소개 자료를 열어 주세요.";
      object.append(fallback);
      deckStatus.after(object);
    } else if (pptx) deckStatus.textContent = "PPT 원본을 받을 수 있어요. 바로 볼 수 있는 소개 자료도 준비하고 있어요.";
    return;
  }
  deckStatus.hidden = true;
  let index = 0;
  const dialog = doc.createElement("dialog");
  dialog.className = "promotion-dialog";
  dialog.setAttribute("aria-label", "소개 자료 전체 화면");
  dialog.innerHTML = '<div class="promotion-dialog__head"><h2>소개 자료</h2><button type="button" class="promotion-close">닫기</button></div>';
  doc.body.append(dialog);
  const viewers = [];
  function makeViewer(container, expanded = false) {
    const viewer = doc.createElement("div");
    viewer.className = "promotion-viewer";
    viewer.tabIndex = 0;
    viewer.setAttribute("aria-label", "소개 자료. 좌우 화살표 키로 넘기기");
    viewer.innerHTML = '<div class="promotion-stage"><img><p role="status" hidden>이 슬라이드를 불러오지 못했어요. 다음 쪽을 보거나 PDF를 열어 주세요.</p></div><div class="promotion-controls"><button type="button" data-prev>이전</button><span class="promotion-counter" aria-live="polite" aria-atomic="true"></span><button type="button" data-next>다음</button></div>';
    const image = viewer.querySelector("img");
    image.addEventListener("error", () => { image.hidden = true; viewer.querySelector("[role=status]").hidden = false; });
    image.addEventListener("load", () => { image.hidden = false; viewer.querySelector("[role=status]").hidden = true; });
    viewer.querySelector("[data-prev]").addEventListener("click", () => go(index - 1));
    viewer.querySelector("[data-next]").addEventListener("click", () => go(index + 1));
    viewer.addEventListener("keydown", e => {
      const target = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: slides.length - 1 }[e.key];
      if (target !== undefined) { e.preventDefault(); go(target); }
    });
    if (!expanded) {
      const button = doc.createElement("button");
      button.type = "button";
      button.textContent = "전체 화면";
      button.addEventListener("click", () => {
        dialog.showModal();
        dialog.requestFullscreen?.().catch(() => {});
      });
      viewer.querySelector(".promotion-controls").append(button);
    }
    container.append(viewer);
    const controls = viewer.querySelector('.promotion-controls');
    if (!expanded) root.querySelector('[data-deck-controls]').append(controls);
    viewers.push({ viewer, controls });
  }
  function go(next) {
    index = Math.max(0, Math.min(slides.length - 1, next));
    for (const { viewer, controls } of viewers) {
      const image = viewer.querySelector("img");
      image.hidden = false;
      viewer.querySelector("[role=status]").hidden = true;
      image.alt = slides[index].alt;
      image.src = slides[index].url;
      controls.querySelector(".promotion-counter").textContent = `${index + 1} / ${slides.length}`;
      controls.querySelector("[data-prev]").disabled = index === 0;
      controls.querySelector("[data-next]").disabled = index === slides.length - 1;
    }
  }
  makeViewer(root.querySelector("[data-deck-viewer]"));
  makeViewer(dialog, true);
  dialog.querySelector("button").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => { if (doc.fullscreenElement === dialog) doc.exitFullscreen().catch(() => {}); });
  go(0);
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-promotion]");
  if (root) initPromotion(root);
}
