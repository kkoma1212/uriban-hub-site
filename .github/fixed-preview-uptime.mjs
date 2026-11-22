import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const origin = "https://uriban-hub.kkoma1212.workers.dev";
const marker = "<!-- uriban-fixed-preview-uptime:v1 -->";

export async function previewReady(request = fetch, wait = delay) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const options = {
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      };
      const response = await request(origin + "/readyz", options);
      if (response.status === 200 && (await response.json()).status === "ready") {
        const [login, bootstrap] = await Promise.all([
          request(origin + "/login", options),
          request(origin + "/api/v1/bootstrap", options),
        ]);
        if (login.status === 200 && bootstrap.status === 401 &&
            (await bootstrap.json()).error?.code === "UNAUTHENTICATED") {
          const html = await login.text();
          const entry = html.match(/<script\b[^>]+\bsrc="(\/assets\/index-[\w-]+\.js)"/u)?.[1];
          if (html.includes("<title>우리반 허브</title>") && entry) {
            const script = await request(origin + entry, options);
            if (script.status === 200 && /^(text|application)\/javascript\b/iu.test(script.headers.get("content-type") ?? "") && (await script.text()).trim()) return true;
          }
        }
      }
    } catch {
      // Timeouts, malformed responses and connection failures each count as one check.
    }
    console.log(`준비 상태 미확인 (${attempt}/3)`);
    if (attempt < 3) await wait(30_000);
  }
  return false;
}

function github(args) {
  return JSON.parse(execFileSync("gh", ["api", ...args], { encoding: "utf8" }));
}

export function recordCheck(ready, repository, runUrl, api = github) {
  const path = `repos/${repository}/issues`;
  // List issues directly, since the search index can lag behind writes.
  const pages = api(["--paginate", "--slurp", path + "?state=open&creator=github-actions%5Bbot%5D&per_page=100"]);
  const open = pages.flat().filter(issue => !issue.pull_request &&
    issue.user?.login === "github-actions[bot]" && issue.body?.startsWith(marker + "\n"));
  if (open.length > 1) throw new Error("접속 감시 이슈가 여러 건 열려 있습니다.");
  const incident = open[0];
  if (!incident && ready) return "정상";
  if (!incident) {
    const owner = repository.split("/")[0];
    const body = [
      marker, `@${owner} 검수 사이트의 준비 상태, 로그인 화면, 비로그인 API 응답을 세 차례 함께 확인했지만 정상 접속을 확인하지 못했습니다.`,
      "", `[검수 사이트](${origin}/login) · [최초 점검 기록](${runUrl})`,
      "", "이 이슈가 열려 있는 동안 매시간 점검 결과는 Actions 실행 요약에 기록됩니다. 접속이 복구되면 감시가 이 이슈를 닫습니다.",
    ].join("\n");
    const created = api(["--method", "POST", path, "-f", "title=우리반 허브 검수 사이트 접속 장애", "-f", "body=" + body]);
    return `장애 발생 · #${created.number}`;
  }
  if (!ready) return `장애 지속 · #${incident.number}`;
  api(["--method", "PATCH", path + "/" + incident.number, "-f", "state=closed", "-f", "state_reason=completed"]);
  return `복구 · #${incident.number}`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { GITHUB_REPOSITORY: repo, GITHUB_RUN_ID: runId, GITHUB_STEP_SUMMARY: summary } = process.env;
  const result = recordCheck(await previewReady(), repo, `https://github.com/${repo}/actions/runs/${runId}`);
  const line = "검수 사이트 접속 감시 — " + result;
  console.log(line);
  appendFileSync(summary, line + "\n");
}
