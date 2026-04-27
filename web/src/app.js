// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import {
  getAuthEnabled,
  getEnterpriseTaskManagerEnabled,
  refreshApplicationSettings,
} from "./utils/authority";
import request from "./utils/request";
import { setSetupRequired } from "@/utils/setup";
import { getHealth } from "@/services/system"
import PlatformContainer from "./components/PlatformContainer";
import React from "react";
import { message, notification } from "antd";

message.config({
  maxCount: 3,
});

notification.config({
  placement: "topRight",
});

const CHUNK_RELOAD_KEY = "console.chunk-reload";
const CHUNK_RELOAD_WINDOW_MS = 15000;
const CHUNK_RELOAD_QUERY_KEY = "_reload_ts";

if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function(search, replacement) {
    const pattern = typeof search === 'string' ? RegExp(search, 'g') : search;
    return this.replace(pattern, replacement);
  };
}

const isChunkLoadError = (error) => {
  const reason =
    error?.message ||
    error?.reason?.message ||
    error?.reason ||
    "";
  return /ChunkLoadError|Loading chunk [\d]+ failed|CSS_CHUNK_LOAD_FAILED/i.test(
    `${reason}`
  );
};

const isInjectedScriptConnectionError = (error) => {
  const reason =
    error?.message ||
    error?.reason?.message ||
    error?.reason ||
    error ||
    "";
  const stack = `${error?.stack || error?.reason?.stack || ""}`;
  return (
    `${reason}`.includes("Could not establish connection. Receiving end does not exist.") &&
    (stack.includes("single-file-bootstrap.bundle.js") || stack === "")
  );
};

const suppressUnhandledRejection = (event) => {
  event.preventDefault?.();
  event.stopImmediatePropagation?.();
  event.stopPropagation?.();
};

const getCanonicalLocation = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete(CHUNK_RELOAD_QUERY_KEY);
  return `${url.pathname}${url.search}${url.hash}`;
};

const buildReloadLocation = () => {
  const url = new URL(window.location.href);
  url.searchParams.set(CHUNK_RELOAD_QUERY_KEY, `${Date.now()}`);
  return `${url.pathname}${url.search}${url.hash}`;
};

const shouldReloadForChunkError = () => {
  const now = Date.now();
  const currentLocation = getCanonicalLocation();

  try {
    const raw = sessionStorage.getItem(CHUNK_RELOAD_KEY);
    const previous = raw ? JSON.parse(raw) : null;
    if (
      previous?.location === currentLocation &&
      now - Number(previous?.timestamp || 0) < CHUNK_RELOAD_WINDOW_MS
    ) {
      return false;
    }
    sessionStorage.setItem(
      CHUNK_RELOAD_KEY,
      JSON.stringify({
        location: currentLocation,
        timestamp: now,
      })
    );
  } catch (e) {}

  return true;
};

const installChunkReloadRecovery = () => {
  if (typeof window === "undefined" || window.__consoleChunkReloadRecoveryInstalled) {
    return;
  }

  window.__consoleChunkReloadRecoveryInstalled = true;

  const handleChunkFailure = (error) => {
    if (!isChunkLoadError(error) || !shouldReloadForChunkError()) {
      return false;
    }
    window.location.replace(buildReloadLocation());
    return true;
  };

  window.addEventListener("error", (event) => {
    handleChunkFailure(event?.error || new Error(event?.message || ""));
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (handleChunkFailure(event?.reason)) {
      suppressUnhandledRejection(event);
      return;
    }
    if (isInjectedScriptConnectionError(event?.reason || event)) {
      suppressUnhandledRejection(event);
    }
  }, true);
};

const serializeConsoleArgs = (args = []) => {
  return args
    .map((arg) => {
      if (typeof arg === "string") {
        return arg;
      }
      if (arg instanceof Error) {
        return arg.stack || arg.message;
      }
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return String(arg);
      }
    })
    .join(" ");
};

const isUmiDllWarning = (args = []) => {
  const message = serializeConsoleArgs(args);
  if (!/warning:/i.test(message)) {
    return false;
  }
  const stack = new Error().stack || "";
  return stack.includes("/umi.dll.js");
};

const installConsoleWarningFilter = () => {
  if (
    typeof window === "undefined" ||
    process.env.NODE_ENV === "development" ||
    window.__consoleWarningFilterInstalled
  ) {
    return;
  }

  window.__consoleWarningFilterInstalled = true;

  ["warn", "error"].forEach((method) => {
    const original = console[method];
    if (typeof original !== "function") {
      return;
    }
    console[method] = function(...args) {
      if (isUmiDllWarning(args)) {
        return;
      }
      return original.apply(this, args);
    };
  });
};

installChunkReloadRecovery();
installConsoleWarningFilter();

export async function patchRoutes(routes) {
  await refreshApplicationSettings();
  const healthRes = await getHealth();
  setSetupRequired(`${healthRes?.setup_required}`);
  if (getEnterpriseTaskManagerEnabled() !== "true") {
    routes = hideRoutesInMenu(routes, ["data_tools"], "");
  }
  if (getAuthEnabled() === "false") {
    routes = filterRoutes(routes, ["system.security"], "");
    // routes = disableAuth(routes);
  }
  return routes;
}


export function render(oldRoutes) {
  oldRoutes();
}

// function disableAuth(routes) {
//   return (routes || []).map((route) => {
//     if (route.name && route.authority) {
//       delete route.authority;
//     }
//     if (route.routes) {
//       route.routes = disableAuth(route.routes);
//     }
//     return route;
//   });
// }

function filterRoutes(routes, names, prefix) {
  return routes.filter((route) => {
    if (route.name) {
      const pn = prefix ? `${prefix}.${route.name}` : route.name;
      if (names.includes(pn)) {
        return false;
      }
    }
    if (route.routes) {
      let pn = "";
      if (route.name) {
        pn = prefix ? `${prefix}.${route.name}` : route.name;
      }
      route.routes = filterRoutes(route.routes, names, pn);
    }
    return true;
  });
}

function hideRoutesInMenu(routes, names, prefix) {
  return (routes || []).map((route) => {
    const nextRoute = { ...route };
    if (nextRoute.name) {
      const pn = prefix ? `${prefix}.${nextRoute.name}` : nextRoute.name;
      if (names.includes(pn)) {
        nextRoute.hideInMenu = true;
      }
    }
    if (nextRoute.routes) {
      let pn = "";
      if (nextRoute.name) {
        pn = prefix ? `${prefix}.${nextRoute.name}` : nextRoute.name;
      }
      nextRoute.routes = hideRoutesInMenu(nextRoute.routes, names, pn);
    }
    return nextRoute;
  });
}


export function rootContainer(container) {
  return React.createElement(PlatformContainer, null, container);
}
