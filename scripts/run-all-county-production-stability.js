const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const writeJSON = (file, value) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, file), `${JSON.stringify(value, null, 2)}\n`);
};

const commands = [
  ["npm", ["run", "test:all-county-user-outcomes"]],
  ["npm", ["run", "test:all-county-three-path-parity"]],
  ["npm", ["run", "test:result-semantics"]],
  ["npm", ["run", "test:new-user-scenarios"]],
  ["npm", ["run", "test:practice-area-matrix"]],
  ["npm", ["run", "test:diy-guide-matrix"]]
];

const runs = [];
for (let run = 1; run <= 3; run += 1) {
  for (const [cmd, args] of commands) {
    const startedAt = new Date().toISOString();
    const started = Date.now();
    const result = spawnSync(cmd, args, {
      cwd: ROOT,
      env: { ...process.env, MFLG_TEST_BASE_URL: process.env.MFLG_TEST_BASE_URL || "https://myfamilylawgroup.com" },
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 20
    });
    const durationMs = Date.now() - started;
    const output = `${result.stdout || ""}\n${result.stderr || ""}`;
    const record = {
      run,
      command: `${cmd} ${args.join(" ")}`,
      startedAt,
      durationMs,
      exitCode: result.status,
      failure: result.status === 0 ? "" : output.slice(-4000),
      timeoutMentioned: /timeout/i.test(output),
      consoleOrNetworkMentioned: /console|network|ERR_|failed to fetch/i.test(output)
    };
    runs.push(record);
    if (result.status !== 0) {
      writeJSON("data/all-county-production-stability.json", {
        version: "1.0.0-all-county-production-stability",
        built_at: new Date().toISOString(),
        base_url: process.env.MFLG_TEST_BASE_URL || "https://myfamilylawgroup.com",
        summary: {
          runs_completed: runs.length,
          failures: runs.filter((item) => item.exitCode !== 0).length,
          retries_hidden: 0
        },
        runs
      });
      process.stdout.write(result.stdout || "");
      process.stderr.write(result.stderr || "");
      process.exit(result.status || 1);
    }
  }
}

const output = {
  version: "1.0.0-all-county-production-stability",
  built_at: new Date().toISOString(),
  base_url: process.env.MFLG_TEST_BASE_URL || "https://myfamilylawgroup.com",
  summary: {
    runs_completed: runs.length,
    failures: runs.filter((item) => item.exitCode !== 0).length,
    retries_hidden: 0,
    timeout_mentions: runs.filter((item) => item.timeoutMentioned).length,
    console_or_network_mentions: runs.filter((item) => item.consoleOrNetworkMentioned).length
  },
  runs
};
writeJSON("data/all-county-production-stability.json", output);
console.log("ALL_COUNTY_PRODUCTION_STABILITY_PASS");
console.log(JSON.stringify(output.summary, null, 2));
