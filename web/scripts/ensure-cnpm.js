"use strict";

const execPath = `${process.env.npm_execpath || ""}`.toLowerCase();
const userAgent = `${process.env.npm_config_user_agent || ""}`.toLowerCase();

const isCnpm =
  execPath.includes("cnpm") ||
  execPath.includes("npminstall") ||
  userAgent.includes("cnpm/") ||
  userAgent.includes("npminstall/");

if (!isCnpm) {
  console.error("");
  console.error("This frontend only supports dependency installation via cnpm.");
  console.error("Please use: cnpm install");
  console.error("");
  process.exit(1);
}
