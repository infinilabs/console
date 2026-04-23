"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const mode = process.argv[2];

if (!mode || !["dev", "build"].includes(mode)) {
  console.error("usage: node scripts/run-umi.js <dev|build>");
  process.exit(1);
}

const syncStaticAssets = () => {
  const staticDir = path.resolve(__dirname, "../static");
  const publicStaticDir = path.resolve(__dirname, "../public/static");

  if (!fs.existsSync(staticDir)) {
    return;
  }

  fs.mkdirSync(path.dirname(publicStaticDir), { recursive: true });
  fs.rmSync(publicStaticDir, { recursive: true, force: true });
  fs.cpSync(staticDir, publicStaticDir, { recursive: true });
};

syncStaticAssets();

const defaultOldSpaceSize =
  process.env.UMI_MAX_OLD_SPACE_SIZE || (mode === "build" ? "8192" : "4096");

const nodeMajorVersion = Number(process.versions.node.split(".")[0] || "0");
const existingNodeOptions = (process.env.NODE_OPTIONS || "").trim();
const optionSet = new Set(existingNodeOptions.split(/\s+/).filter(Boolean));

if (![...optionSet].some((item) => item.startsWith("--max_old_space_size="))) {
  optionSet.add(`--max_old_space_size=${defaultOldSpaceSize}`);
}

if (
  nodeMajorVersion >= 17 &&
  !optionSet.has("--openssl-legacy-provider")
) {
  optionSet.add("--openssl-legacy-provider");
}

optionSet.add("--trace-deprecation");

const env = {
  ...process.env,
  NODE_OPTIONS: [...optionSet].join(" "),
};

if (mode === "dev") {
  env.UMI_UI = env.UMI_UI || "none";
}

const result = spawnSync("./node_modules/.bin/umi", [mode], {
  stdio: "inherit",
  shell: true,
  env,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status || 0);
