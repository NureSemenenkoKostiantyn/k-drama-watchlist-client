import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { findApiContractSource } from "./api-contract-source.mjs";

const cli = resolve("node_modules", "openapi-typescript", "bin", "cli.js");
const output = resolve(
  "src",
  "app",
  "core",
  "api",
  "generated",
  "api-contracts.ts",
);
const args = [cli, findApiContractSource(), "--output", output];

if (process.argv.includes("--check")) {
  args.push("--check");
}

const result = spawnSync(process.execPath, args, {
  stdio: "inherit",
  shell: false,
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
