const { spawn } = require("node:child_process");
const { platform } = require("node:process");
const path = require("node:path");

const scriptDir = __dirname;

const isWindows = platform === "win32";
const command = isWindows ? "powershell" : "bash";
const args = isWindows
  ? [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(scriptDir, "run.ps1"),
    ]
  : [path.join(scriptDir, "run.sh")];

const child = spawn(command, args, { stdio: "inherit" });

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
