import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const visibleLoginForm = `Array.from(document.forms).some(form =>
  ['#login-email', '#login-password', 'button[type="submit"]'].every(selector => {
    const el = form.querySelector(selector);
    return el && getComputedStyle(el).visibility === 'visible' && el.getClientRects().length > 0;
  }))`;

async function connect(address) {
  const socket = new WebSocket(address);
  try {
    await once(socket, "open", { signal: AbortSignal.timeout(1500) });
    return socket;
  } catch (error) {
    socket.close();
    throw error;
  }
}

async function browserEndpoint(profile) {
  const [number, path] = (await readFile(join(profile, "DevToolsActivePort"), "utf8")).trim().split(/\r?\n/u);
  const port = Number(number);
  if (!Number.isInteger(port) || port <= 0 || port > 65535 || !/^\/devtools\/browser\/[\w-]+$/u.test(path)) throw Error("Browser is not ready");
  return { origin: `http://127.0.0.1:${port}`, socket: `ws://127.0.0.1:${port}${path}` };
}

async function loginPageSocket(profile, url) {
  const endpoint = await browserEndpoint(profile);
  const response = await fetch(endpoint.origin + "/json/list", { signal: AbortSignal.timeout(1500) });
  const targets = await response.json();
  const page = targets.find(target => target.type === "page" && target.url === url);
  return page && connect(page.webSocketDebuggerUrl);
}

function evaluateForm(socket, id) {
  return new Promise(resolve => {
    const done = (ready) => {
      clearTimeout(timer);
      socket.removeEventListener("message", receive);
      resolve(ready);
    };
    const receive = event => {
      const message = JSON.parse(event.data);
      if (message.id === id) done(message.result?.result.value === true);
    };
    const timer = setTimeout(() => done(false), 1500);
    socket.addEventListener("message", receive);
    socket.send(JSON.stringify({ id, method: "Runtime.evaluate", params: { expression: visibleLoginForm, returnByValue: true } }));
  });
}

// Start with an empty cache and service-worker registration for each observation.
export async function loginFormReady(url, executable = "google-chrome") {
  const profile = await mkdtemp(join(tmpdir(), "classhub-uptime-"));
  const env = { ...process.env };
  delete env.GH_TOKEN;
  delete env.GITHUB_TOKEN;
  const child = spawn(executable, [
    "--headless=new", "--disable-gpu", "--disable-extensions", "--no-first-run",
    "--disable-background-networking", "--no-default-browser-check", "--disable-sync",
    "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0",
    "--user-data-dir=" + profile, url,
  ], { env, windowsHide: true, stdio: "ignore" });
  let closed = false;
  // close follows error as well when the executable cannot be started.
  let launchError;
  child.on("error", error => { launchError = error; });
  const ended = new Promise(resolve => child.once("close", () => { closed = true; resolve(); }));
  let socket;
  try {
    const deadline = Date.now() + 20_000;
    for (let id = 1; !launchError && !(closed && child.exitCode !== 0) && Date.now() < deadline; id++) {
      try {
        if (!socket || socket.readyState === WebSocket.CLOSED) socket = await loginPageSocket(profile, url);
        if (socket?.readyState === WebSocket.OPEN && await evaluateForm(socket, id)) return true;
      } catch {
        // Chromium may still be starting or navigating to the login document.
      }
      await delay(200);
    }
    return false;
  } finally {
    try {
      const browser = await connect((await browserEndpoint(profile)).socket);
      try {
        const disconnected = once(browser, "close", { signal: AbortSignal.timeout(3000) });
        browser.send(JSON.stringify({ id: 1, method: "Browser.close" }));
        await disconnected;
      } finally {
        browser.close();
      }
    } catch {
      // If launching failed there may be no debugging endpoint.
    }
    socket?.close();
    await Promise.race([ended, delay(1500, undefined, { ref: false })]);
    if (!closed) { child.kill(); await ended; }
    await rm(profile, { force: true, recursive: true, maxRetries: 10, retryDelay: 200 });
  }
}
