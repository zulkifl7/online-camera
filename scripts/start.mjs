import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = process.env.PORT || "3000";
const nextBin = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "start", "--hostname", "127.0.0.1", "--port", port], {
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 1));
