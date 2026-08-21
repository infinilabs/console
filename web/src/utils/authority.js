import request from "./request";
import {
  getAuthorizationToken,
  getStoredLoginResponse,
} from "./auth_session";
import { setSetupRequired } from "./setup";

const APPLICATION_AUTH_KEY = "infini-auth";
const APPLICATION_ROLLUP_KEY = "infini-rollup-enabled";
const ENTERPRISE_TASK_MANAGER_KEY = "infini-enterprise-task-manager-enabled";
export const APPLICATION_SETTINGS_UPDATED_EVENT =
  "console:application-settings-updated";
let applicationSettingsPromise = null;
let applicationSettingsCache = null;

export function invalidateApplicationSettingsCache() {
  applicationSettingsPromise = null;
  applicationSettingsCache = null;
}

function persistApplicationSettings(res) {
  localStorage.setItem(APPLICATION_AUTH_KEY, `${res.auth_enabled}`);
  if (typeof res.setup_required !== "undefined") {
    setSetupRequired(`${!!res.setup_required}`);
  }
  localStorage.setItem(
    APPLICATION_ROLLUP_KEY,
    `${!!res.system_cluster?.rollup_enabled}`
  );
  localStorage.setItem(
    ENTERPRISE_TASK_MANAGER_KEY,
    `${!!res.enterprise_plugins?.task_manager}`
  );
}

function normalizeAuthorityValue(authority) {
  if (authority == null || authority === "") {
    return [];
  }

  let normalized = authority;
  if (typeof normalized === "string") {
    try {
      normalized = JSON.parse(normalized);
    } catch (e) {
      normalized = authority;
    }
  }

  if (typeof normalized === "string") {
    return [normalized];
  }

  if (Array.isArray(normalized)) {
    return normalized.filter((item) => typeof item === "string" && item);
  }

  return [];
}

export function extractAuthorityFromResponse(payload) {
  const source = payload?._source || payload;
  const candidates = [
    source?.privilege,
    payload?.privilege,
    source?.permissions,
    payload?.permissions,
    source?.currentAuthority,
    payload?.currentAuthority,
  ];

  for (const candidate of candidates) {
    const authority = normalizeAuthorityValue(candidate);
    if (authority.length > 0) {
      return authority;
    }
  }

  return [];
}

// use localStorage to store the authority info, which might be sent from server in actual project.
export function getAuthority(str) {
  const authorityString =
    typeof str === "undefined"
      ? localStorage.getItem("infini-console-authority")
      : str;
  const authority = normalizeAuthorityValue(authorityString);
  if (authority.length > 0 || typeof str !== "undefined") {
    return authority;
  }
  return extractAuthorityFromResponse(getStoredLoginResponse());
}

export function setAuthority(authority) {
  const proAuthority = normalizeAuthorityValue(authority);
  return localStorage.setItem(
    "infini-console-authority",
    JSON.stringify(proAuthority)
  );
}

export function syncAuthorityFromResponse(payload) {
  const authority = extractAuthorityFromResponse(payload);
  if (authority.length > 0) {
    setAuthority(authority);
  }
  return authority;
}

export function hasAuthority(authority) {
  if (getAuthEnabled() === "true") {
    const userAuthority = getAuthority() || [];
    return userAuthority.some((ua) => ua == authority);
  }
  return true;
}

export function getAuthEnabled() {
  return localStorage.getItem(APPLICATION_AUTH_KEY);
}

export function isLogin() {
  const loginResponse = getStoredLoginResponse();
  if (loginResponse?.username && loginResponse?.status == "ok") {
    return true;
  }
  return false;
}

export function getAuthorizationHeader() {
  const accessToken = getAuthorizationToken();
  if (accessToken) {
    return "Bearer " + accessToken;
  }
  return "";
}

export function getRollupEnabled() {
  return localStorage.getItem(APPLICATION_ROLLUP_KEY);
}

export function getEnterpriseTaskManagerEnabled() {
  return localStorage.getItem(ENTERPRISE_TASK_MANAGER_KEY);
}

export async function refreshApplicationSettings(force = false) {
  if (applicationSettingsPromise) {
    return applicationSettingsPromise;
  }

  if (!force && applicationSettingsCache) {
    return applicationSettingsCache;
  }

  applicationSettingsPromise = request("/setting/application")
    .then((res) => {
      if (res && !res.error) {
        persistApplicationSettings(res);
        applicationSettingsCache = res;
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent(APPLICATION_SETTINGS_UPDATED_EVENT, {
              detail: res,
            })
          );
        }
      }
      return res;
    })
    .finally(() => {
      applicationSettingsPromise = null;
    });

  return applicationSettingsPromise;
}
