import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { loadAppLink, openApp, parseAppLink } from "../assets/app-link.mjs";

const document = { version: 1, mode: "preview", url: "https://example-preview.trycloudflare.com/login", updatedAt: "2026-09-27T00:00:00.000Z" };

test("valid destination, paused state and fixed-address migration", () => {
  assert.equal(parseAppLink(document).url, document.url);
  assert.throws(() => parseAppLink({ ...document, mode: "paused" }), /PAUSED/);
  assert.equal(parseAppLink({ ...document, mode: "fixed", url: "https://uribanhub.com/login" }).url, "https://uribanhub.com/login");
  assert.equal(parseAppLink({ ...document, mode: "fixed", url: "https://app.uribanhub.com/login" }).url, "https://app.uribanhub.com/login");
});

test("fixed destinations retain strict host, protocol and login-path restrictions", () => {
  for (const url of [
    "http://uribanhub.com/login", "https://www.uribanhub.com/login",
    "https://admin.uribanhub.com/login", "https://uribanhub.com.evil.test/login",
    "https://eviluribanhub.com/login", "https://uribanhub.com./login",
    "https://uribanhub.com@evil.test/login", "https://user@uribanhub.com/login",
    "https://user:pass@app.uribanhub.com/login", "https://uribanhub.com:444/login",
    "https://app.uribanhub.com:444/login", "https://uribanhub.com/",
    "https://uribanhub.com/sign-up", "https://uribanhub.com/login/",
    "https://uribanhub.com/login?next=https://evil.test", "https://uribanhub.com/login#anything",
    "https://example-preview.trycloudflare.com/login",
  ]) assert.throws(() => parseAppLink({ ...document, mode: "fixed", url }), url);
  assert.throws(() => parseAppLink({ ...document, url: "https://uribanhub.com/login" }));
});

test("published configuration uses the verified company login address", () => {
  const configuration = JSON.parse(readFileSync(new URL("../app-link.json", import.meta.url), "utf8"));
  assert.equal(configuration.mode, "fixed");
  assert.equal(parseAppLink(configuration).url, "https://uribanhub.com/login");
});

test("rejects other sites, credentials, query redirects, malformed data and unsafe protocols", () => {
  for (const url of ["javascript:alert(1)", "http://example.trycloudflare.com/login", "https://example.trycloudflare.com.evil.test/login", "https://example.trycloudflare.com@evil.test/login", "https://user:pass@example.trycloudflare.com/login", "https://example.trycloudflare.com/login?next=evil", "https://example.trycloudflare.com/login#anything", "https://example.trycloudflare.com:444/login", "https://api.trycloudflare.com/login", "https://127.0.0.1/login"]) assert.throws(() => parseAppLink({ ...document, url }));
  for (const value of [null, {}, { ...document, version: 2 }, { ...document, updatedAt: "invalid" }]) assert.throws(() => parseAppLink(value));
});

test("a fresh configuration is fetched without credentials or redirect following", async () => {
  const value = await loadAppLink(async (url, options) => {
    assert.equal(url.pathname.endsWith("/app-link.json"), true);
    assert.ok(url.searchParams.get("v"));
    assert.equal(options.cache, "no-store");
    assert.equal(options.credentials, "omit");
    assert.equal(options.redirect, "error");
    return { ok: true, json: async () => document };
  });
  assert.equal(value.url, document.url);
  await assert.rejects(loadAppLink(async () => ({ ok: false })), /LINK_UNAVAILABLE/);
});

test("successful click navigates to the freshly loaded destination", async () => {
  const events = [];
  await openApp({ load: async () => parseAppLink(document), navigate: (url) => events.push(url), report: (value) => events.push(value), finish: () => events.push("finished") });
  assert.deepEqual(events, ["최신 접속 주소를 확인하고 있어요.", document.url, "finished"]);
});

test("offline, invalid and paused states stay on the entry page with a retry explanation", async () => {
  for (const reason of ["PAUSED", "INVALID_LINK", "offline"]) {
    const messages = [];
    await openApp({ load: async () => { throw new Error(reason); }, navigate: () => assert.fail("Must not navigate"), report: (value) => messages.push(value) });
    assert.match(messages.at(-1), reason === "PAUSED" ? /잠시 쉬고/ : /확인하지 못/);
  }
});

test("public copy and entry paths agree with approval requirements", () => {
  const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const start = readFileSync(new URL("../start.html", import.meta.url), "utf8");
  assert.equal(index.includes("시범"), false);
  assert.equal(index.includes("6주"), false);
  assert.match(index, /교사 기능은.*운영자 승인/u);
  assert.match(start, /교사 기능은.*운영자 승인/u);
  assert.match(index, /개인정보 대신 예시 정보/u);
  assert.equal((index.match(/href="start.html" data-app-entry>/g) ?? []).length, 4);
  // 개인정보처리방침·이용약관 링크는 같은 최신 앱 주소의 /legal/ 화면으로만 연다.
  const legal = [...index.matchAll(/data-app-entry data-app-entry-path="([^"]+)"/g)].map((value) => value[1]);
  assert.ok(legal.length >= 2);
  for (const path of legal) assert.match(path, /^\/legal\/(privacy-policy|terms)$/u);
  const ids = new Set([...index.matchAll(/\bid="([^"]+)"/g)].map((value) => value[1]));
  for (const [, target] of index.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(target), target);
});
