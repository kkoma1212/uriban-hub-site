import assert from "node:assert/strict";
import test from "node:test";
import { previewReady } from "./fixed-preview-uptime.mjs";

function mockReady(url) {
  switch (new URL(url).pathname) {
    case "/readyz":
      return Response.json({ status: "ready" });
    case "/api/v1/bootstrap":
      return Response.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 });
    case "/login":
      return new Response('<title>우리반 허브</title><script src="/assets/index-example.js"></script>');
    case "/assets/index-example.js":
      return new Response("import './login.js'", { headers: { "Content-Type": "application/javascript" } });
    default:
      throw Error("Unexpected request");
  }
}

test("requires the rendered login form before reporting recovery", async () => {
  let checks = 0;
  const check = () => { checks++; return false; };
  assert.equal(await previewReady(mockReady, async () => {}, check), false);
  assert.equal(checks, 3);
  assert.equal(await previewReady(mockReady, async () => {}, () => true), true);
});
