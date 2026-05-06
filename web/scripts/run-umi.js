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

const syncPluginDirectory = async () => {
  const pluginDir = path.resolve(__dirname, "../../plugin/enterprise/web"); 
  const pagesDir = path.resolve(__dirname, "../");

  if (fs.existsSync(pluginDir)) {
    console.log("Plugin directory found. Syncing with the main project...");

    try {
      fs.cpSync(pluginDir, pagesDir, { recursive: true, force: true });
      console.log(`Plugin synced directly to ${pagesDir}`);
    } catch (err) {
      console.error(`Failed to sync plugin to ${pagesDir}:`, err);
    }
  } else {
    console.log("No plugin directory found, skipping sync.");
  }
};

const watchPluginChanges = async () => {
  const chokidar = await import("chokidar"); 

  const pluginDir = path.resolve(__dirname, "../../plugin/enterprise/web");
  
  if (fs.existsSync(pluginDir)) {
    const watcher = chokidar.watch(pluginDir, { persistent: true });

    watcher.on("change", (filePath) => {
      console.log(`File changed: ${filePath}`);
      syncPluginDirectory();
    });

    watcher.on("error", (err) => {
      console.error("Error watching plugin directory:", err);
    });

    console.log(`Watching plugin directory for changes: ${pluginDir}`);
  } else {
    console.log("Plugin directory not found, skipping file watching.");
  }
};

const run = async () => {
  syncStaticAssets();

  await syncPluginDirectory();

  if (mode === "dev") {
    await watchPluginChanges(); 
  }

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
};

run();