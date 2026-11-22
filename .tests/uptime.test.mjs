import assert from "node:assert/strict";
import test from "node:test";
import { previewReady, recordCheck } from "../.github/fixed-preview-uptime.mjs";

test("two schedules share one incident from first outage through recovery", () => {
  const repo = "example/review";
  const issues = [{ number: 4, user: { login: "someone" }, body: "Unrelated", state: "open" }];
  const writes = [];
  function api(args) {
    if (args[0] === "--paginate") return [[], issues.filter(issue => issue.state === "open")];
    writes.push(args[1]);
    if (args[1] === "POST") {
      const body = args.at(-1).slice("body=".length);
      assert(body.includes("@example"));
      const issue = { number: issues.length + 10, state: "open", body, user: { login: "github-actions[bot]" } };
      issues.push(issue);
      issues.push({ ...issue, number: 999, user: { login: "someone" } });
      return issue;
    }
    assert.equal(args[1], "PATCH");
    const number = Number(args[2].split("/").at(-1));
    const issue = issues.find(item => item.number === number);
    assert.equal(args[4], "state=closed");
    issue.state = "closed";
    return issue;
  }
  const run = ready => recordCheck(ready, repo, "https://example.test/run", api);
  assert.equal(run(true), "정상");
  assert.match(run(false), /장애 발생/);
  assert.match(run(false), /장애 지속/);
  assert.match(run(false), /장애 지속/);
  assert.match(run(true), /복구/);
  assert.equal(run(true), "정상");
  assert.match(run(false), /장애 발생/);
  assert.deepEqual(writes, ["POST", "PATCH", "POST"]);
  assert.equal(issues.find(issue => issue.number === 999).state, "open");
});

test("transient and malformed responses are retried, with no redirect accepted", async () => {
  let waits = [], attempts = 0;
  const result = await previewReady(async (url, options) => {
    assert.equal(new URL(url).pathname, "/readyz");
    assert.equal(options.redirect, "manual");
    attempts++;
    if (attempts === 1) throw new Error("timeout");
    if (attempts === 2) return new Response("not JSON");
    return Response.json({ status: "ready" });
  }, async ms => waits.push(ms));
  assert.equal(result, true);
  assert.deepEqual(waits, [30_000, 30_000]);
  for (const response of [502, 302, 200]) {
    let count = 0;
    assert.equal(await previewReady(async () => {
      count++;
      return Response.json({ status: response === 200 ? "unready" : "ready" }, { status: response });
    }, async () => {}), false);
    assert.equal(count, 3);
  }
});

test("an unreadable incident list does not create a notification", () => {
  let calls = 0;
  assert.throws(() => recordCheck(false, "example/review", "run", () => {
    calls++;
    throw new Error("unable to read issues");
  }));
  assert.equal(calls, 1);
});
