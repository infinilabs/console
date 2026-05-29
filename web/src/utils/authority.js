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

// use localStorage to store the authority info, which might be sent from server in actual project.
export function getAuthority(str) {
  // return localStorage.getItem('infini-console-authority') || ['admin', 'user'];
  const authorityString =
    typeof str === "undefined"
      ? localStorage.getItem("infini-console-authority")
      : str;
  // authorityString could be admin, "admin", ["admin"]
  let authority;
  try {
    authority = JSON.parse(authorityString);
  } catch (e) {
    authority = authorityString;
  }
  if (typeof authority === "string") {
    return [authority];
  }
  return authority;
}

export function setAuthority(authority) {
  const proAuthority = typeof authority === "string" ? [authority] : authority;
  return localStorage.setItem(
    "infini-console-authority",
    JSON.stringify(proAuthority)
  );
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

(async function() {
  await refreshApplicationSettings();
})();
