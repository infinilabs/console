"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
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

const walkFiles = (dir, baseDir = dir) => {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(absolutePath, baseDir);
    }
    return [path.relative(baseDir, absolutePath)];
  });
};

const copyFileWithParents = (source, target) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
};

const removeEmptyParents = (targetPath, stopPath) => {
  let current = path.dirname(targetPath);
  while (current.startsWith(stopPath) && current !== stopPath) {
    if (!fs.existsSync(current) || fs.readdirSync(current).length > 0) {
      break;
    }
    fs.rmdirSync(current);
    current = path.dirname(current);
  }
};

const createPluginSyncSnapshot = (pluginDir, webDir) => {
  const licenceRelativePath = path.join("src", "components", "Licence");
  const licenceDir = path.join(webDir, licenceRelativePath);
  const snapshotRoot = fs.mkdtempSync(path.join(os.tmpdir(), "console-plugin-sync-"));
  const backupRoot = path.join(snapshotRoot, "backup");
  const licenceBackupDir = path.join(snapshotRoot, "licence");
  const backedUpFiles = [];
  const createdFiles = [];
  const pluginFiles = walkFiles(pluginDir);

  let licenceExisted = false;
  if (fs.existsSync(licenceDir)) {
    licenceExisted = true;
    fs.cpSync(licenceDir, licenceBackupDir, { recursive: true });
  }

  for (const relativePath of pluginFiles) {
    if (
      relativePath === licenceRelativePath ||
      relativePath.startsWith(`${licenceRelativePath}${path.sep}`)
    ) {
      continue;
    }

    const targetPath = path.join(webDir, relativePath);
    if (fs.existsSync(targetPath)) {
      const backupPath = path.join(backupRoot, relativePath);
      copyFileWithParents(targetPath, backupPath);
      backedUpFiles.push(relativePath);
    } else {
      createdFiles.push(relativePath);
    }
  }

  return {
    snapshotRoot,
    backupRoot,
    backedUpFiles,
    createdFiles,
    licenceExisted,
    licenceBackupDir,
    licenceDir,
    webDir,
  };
};

const restorePluginSyncSnapshot = (snapshot) => {
  if (!snapshot) {
    return;
  }

  const {
    snapshotRoot,
    backupRoot,
    backedUpFiles,
    createdFiles,
    licenceExisted,
    licenceBackupDir,
    licenceDir,
    webDir,
  } = snapshot;

  try {
    for (const relativePath of createdFiles) {
      const targetPath = path.join(webDir, relativePath);
      fs.rmSync(targetPath, { force: true });
      removeEmptyParents(targetPath, webDir);
    }

    fs.rmSync(licenceDir, { recursive: true, force: true });
    if (licenceExisted) {
      fs.cpSync(licenceBackupDir, licenceDir, { recursive: true });
    }

    for (const relativePath of backedUpFiles) {
      const backupPath = path.join(backupRoot, relativePath);
      const targetPath = path.join(webDir, relativePath);
      copyFileWithParents(backupPath, targetPath);
    }
  } finally {
    fs.rmSync(snapshotRoot, { recursive: true, force: true });
  }
};

const syncPluginDirectory = async ({ createSnapshot = false } = {}) => {
  const pluginDir = path.resolve(__dirname, "../../plugin/enterprise/web"); 
  const webDir = path.resolve(__dirname, "../");
  const licenceDir = path.resolve(webDir, "src/components/Licence");

  if (fs.existsSync(pluginDir)) {
    console.log("Plugin directory found. Syncing with the main project...");

    try {
      const snapshot = createSnapshot ? createPluginSyncSnapshot(pluginDir, webDir) : null;
      fs.rmSync(licenceDir, { recursive: true, force: true })
      fs.cpSync(pluginDir, webDir, { recursive: true, force: true });
      console.log(`Plugin synced directly to ${webDir}`);
      return snapshot;
    } catch (err) {
      console.error(`Failed to sync plugin to ${webDir}:`, err);
      return null;
    }
  } else {
    console.log("No plugin directory found, skipping sync.");
    return null;
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

  const snapshot = await syncPluginDirectory({ createSnapshot: mode === "build" });

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

  let exitCode = 0;
  try {
    const result = spawnSync("./node_modules/.bin/umi", [mode], {
      stdio: "inherit",
      shell: true,
      env,
    });

    if (result.error) {
      console.error(result.error);
      exitCode = 1;
    } else {
      exitCode = result.status || 0;
    }
  } finally {
    if (mode === "build") {
      restorePluginSyncSnapshot(snapshot);
    }
  }

  process.exit(exitCode);
};

run();
