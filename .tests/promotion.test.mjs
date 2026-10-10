import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { mediaUrl, youtubeVideoId } from "../assets/promotion.mjs";

// Run initialization with the HTTPS module location used by the public site.
const browserSource = readFileSync(new URL("../assets/promotion.mjs", import.meta.url), "utf8")
  .replaceAll("import.meta.url", JSON.stringify("https://kkoma1212.github.io/uriban-hub-site/assets/promotion.mjs"));
const { initPromotion } = await import(`data:text/javascript;base64,${Buffer.from(browserSource).toString("base64")}`);

test("YouTube Shorts, shared and watch links resolve to the same video", () => {
  for (const url of ["https://www.youtube.com/shorts/AbCdEf123_-?feature=share", "https://youtu.be/AbCdEf123_-?si=share", "https://www.youtube.com/watch?v=AbCdEf123_-", "https://m.youtube.com/watch?v=AbCdEf123_-"]) {
    assert.equal(youtubeVideoId(url), "AbCdEf123_-");
  }
});

// Small DOM stub exercises element insertion and real event handlers without a browser.
class Element {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName;
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.listeners = new Map();
    this.hidden = true;
  }
  append(...children) {
    for (const child of children) { child.parent = this; this.children.push(child); }
  }
  replaceWith(next) {
    const index = this.parent?.children.indexOf(this) ?? -1;
    if (index < 0) return;
    this.parent.children[index] = next;
    next.parent = this.parent;
    this.parent = null;
  }
  setAttribute(name, value) { this[name] = value; }
  addEventListener(name, callback, options) { this.listeners.set(name, { callback, options }); }
  dispatch(name) {
    const listener = this.listeners.get(name);
    if (!listener) return;
    if (listener.options?.once) this.listeners.delete(name);
    listener.callback();
  }
}

async function render(config, run) {
  const created = [];
  const doc = { createElement(tag) { const element = new Element(tag, doc); created.push(element); return element; } };
  const root = new Element("section", doc);
  const fields = new Map();
  for (const name of ["video-status", "deck-status", "video-link", "deck-title", "pdf-link", "pptx-link"]) {
    const element = new Element("div", doc);
    fields.set(`[data-${name}]`, element);
    root.append(element);
  }
  root.querySelector = selector => fields.get(selector);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => config });
  try {
    await initPromotion(root);
    await run({ created, root, fields });
  } finally { globalThis.fetch = originalFetch; }
}

test("YouTube fallback loads only after the explicit button is clicked, once", async () => {
  await render({ videoUrl: "https://youtu.be/AbCdEf123_-" }, ({ created, root }) => {
    assert.equal(created.filter(element => element.tagName === "iframe").length, 0);
    const button = created.find(element => element.tagName === "button");
    assert.equal(button.type, "button");
    assert.equal(button.textContent, "YouTube 영상 보기");
    assert.match(button.parent.children[0].textContent, /YouTube에 연결/);
    button.dispatch("click");
    button.dispatch("click");
    const frames = created.filter(element => element.tagName === "iframe");
    assert.equal(frames.length, 1);
    assert.equal(frames[0].src, "https://www.youtube-nocookie.com/embed/AbCdEf123_-");
    assert.equal(frames[0].referrerPolicy, "strict-origin-when-cross-origin");
    assert.equal(frames[0].loading, "lazy");
    assert.equal(frames[0].allowFullscreen, true);
    assert.match(frames[0].allow, /encrypted-media/);
    assert.ok(root.children.includes(frames[0]));
  });
});

test("invalid fallback URLs expose neither an iframe nor a load button", async () => {
  for (const videoUrl of ["https://youtube.com.evil.test/watch?v=AbCdEf123_-", "javascript:alert(1)", "https://youtu.be/short"]) {
    await render({ videoUrl }, ({ created, fields }) => {
      assert.equal(created.length, 0);
      assert.match(fields.get("[data-video-status]").textContent, /영상 주소/);
    });
  }
});

test("local and HTTPS videoFile retain precedence and do not load YouTube even on error", async () => {
  for (const videoFile of ["assets/promotion/film.mp4", "https://cdn.example.com/film.mp4"]) {
    await render({ videoFile, videoUrl: "https://youtu.be/AbCdEf123_-" }, ({ created, root, fields }) => {
      assert.deepEqual(created.map(element => element.tagName), ["video"]);
      const player = created[0];
      assert.ok(player.src.endsWith("/film.mp4"));
      assert.equal(player.controls, true);
      assert.equal(player.preload, "metadata");
      assert.ok(root.children.includes(player));
      player.dispatch("error");
      assert.ok(root.children.includes(fields.get("[data-video-status]")));
      assert.deepEqual(created.map(element => element.tagName), ["video"]);
      assert.equal(fields.get("[data-video-link]").hidden, false);
    });
  }
});

test("invalid YouTube links never become embedded frames", () => {
  for (const url of ["", null, "javascript:alert(1)", "http://youtu.be/AbCdEf123_-", "https://youtube.com.evil.test/shorts/AbCdEf123_-", "https://user:pass@youtube.com/shorts/AbCdEf123_-", "https://youtu.be/too-short", "https://youtu.be/AbCdEf123_-/extra", "https://youtube.com:444/shorts/AbCdEf123_-"]) assert.equal(youtubeVideoId(url), null);
});

test("media files work under a GitHub Pages repository path and allow HTTPS hosting", () => {
  const base = "https://kkoma1212.github.io/uriban-hub-site/";
  assert.equal(mediaUrl("assets/presentation/slide-01.webp", base), `${base}assets/presentation/slide-01.webp`);
  assert.equal(mediaUrl("https://cdn.example.com/deck.pdf", base), "https://cdn.example.com/deck.pdf");
  for (const url of ["", null, {}, "javascript:alert(1)", "data:text/html,test", "file:///C:/deck.pdf", "http://other.test/deck.pdf", "https://name:password@other.test/deck.pdf"]) assert.equal(mediaUrl(url, base), null);
});
