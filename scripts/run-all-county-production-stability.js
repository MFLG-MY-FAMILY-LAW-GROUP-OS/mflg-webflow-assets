const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const BASE_URL = process.env.MFLG_TEST_BASE_URL || "https://myfamilylawgroup.com";
const COMMAND_TIMEOUT_MS = Number(process.env.MFLG_STABILITY_COMMAND_TIMEOUT_MS || 15 * 60 * 1000);

const commands = [
  ["npm", ["run", "test:result-semantics"]],
  ["npm", ["run", "test:fallback-action-contract"]],
  ["npm", ["run", "test:primary-action-matrix"]],
  ["npm", ["run", "test:non-maricopa-resource-metadata"]],
  ["npm", ["run", "test:fallback-rendered-outcomes"]],
  ["npm", ["run", "test:all-county-scenarios"]],
  ["npm", ["run", "test:new-user-scenarios"]],
  ["npm", ["run", "test:practice-area-matrix"]],
  ["npm", ["run", "test:diy-guide-matrix"]]
];

function writeJSON(file, value) {
  fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, file), `${JSON.stringify(value, null, 2)}\n`);
}

function runCommand(cmd, args) {
  return new Promise((resolve) => {
    const startedAt = new Date().toISOString();
    const started = Date.now();
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const child = spawn(cmd, args, {
      cwd: ROOT,
      detached: true,
      env: { ...process.env, MFLG_TEST_BASE_URL: BASE_URL },
      stdio: ["ignore", "pipe", "pipe"]
    });
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch (_) {}
      setTimeout(() => {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch (_) {}
      }, 5000).unref();
    }, COMMAND_TIMEOUT_MS);
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      const output = `${stdout}\n${stderr}`;
      resolve({
        command: `${cmd} ${args.join(" ")}`,
        startedAt,
        durationMs: Date.now() - started,
        exitCode: code === null ? 1 : code,
        signal: signal || "",
        timedOut,
        failure: code === 0 && !timedOut ? "" : output.slice(-4000),
        timeoutMentioned: timedOut || /timeout/i.test(output),
        consoleOrNetworkMentioned: /console|network|ERR_|failed to fetch/i.test(output)
      });
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        command: `${cmd} ${args.join(" ")}`,
        startedAt,
        durationMs: Date.now() - started,
        exitCode: 1,
        signal: "",
        timedOut,
        failure: error.message,
        timeoutMentioned: timedOut,
        consoleOrNetworkMentioned: false
      });
    });
  });
}

(async () => {
  const runs = [];
  for (let run = 1; run <= 3; run += 1) {
    for (const [cmd, args] of commands) {
      const record = await runCommand(cmd, args);
      record.run = run;
      runs.push(record);
      if (record.exitCode !== 0 || record.timedOut) {
        const failed = {
          version: "1.1.0-all-county-production-stability",
          built_at: new Date().toISOString(),
          base_url: BASE_URL,
          summary: {
            runs_completed: runs.length,
            failures: runs.filter((item) => item.exitCode !== 0 || item.timedOut).length,
            retries_hidden: 0,
            timeout_mentions: runs.filter((item) => item.timeoutMentioned).length,
            console_or_network_mentions: runs.filter((item) => item.consoleOrNetworkMentioned).length
          },
          runs
        };
        writeJSON("data/all-county-production-stability.json", failed);
        process.exit(record.exitCode || 1);
      }
    }
  }
  const output = {
    version: "1.1.0-all-county-production-stability",
    built_at: new Date().toISOString(),
    base_url: BASE_URL,
    summary: {
      runs_completed: runs.length,
      failures: runs.filter((item) => item.exitCode !== 0 || item.timedOut).length,
      retries_hidden: 0,
      timeout_mentions: runs.filter((item) => item.timeoutMentioned).length,
      console_or_network_mentions: runs.filter((item) => item.consoleOrNetworkMentioned).length
    },
    runs
  };
  writeJSON("data/all-county-production-stability.json", output);
  console.log("ALL_COUNTY_PRODUCTION_STABILITY_PASS");
  console.log(JSON.stringify(output.summary, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
