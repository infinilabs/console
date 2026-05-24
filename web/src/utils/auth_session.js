const LOGIN_RESPONSE_KEY = "login-response";
const LOGIN_ACTIVITY_KEY = "login-last-activity-at";
const REFRESH_ENDPOINT = "/account/refresh";
const MIN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
const ACTIVITY_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_PERSIST_INTERVAL_MS = 30 * 1000;
const REFRESH_RETRY_INTERVAL_MS = 30 * 1000;

let refreshPromise = null;
let refreshTimer = null;
let managerStarted = false;
let lastRecordedActivityAt = 0;
let lastRefreshAttemptAt = 0;

function canUseWindow() {
  return typeof window !== "undefined";
}

function parseJSON(value) {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
}

function decodeJwtPayload(token) {
  if (!token || !canUseWindow()) {
    return null;
  }
  const segments = token.split(".");
  if (segments.length < 2) {
    return null;
  }
  try {
    const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(window.atob(padded));
  } catch (e) {
    return null;
  }
}

function toUnixMs(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }
  return numericValue > 1e12 ? numericValue : numericValue * 1000;
}

function normalizeLoginResponse(response, now = Date.now()) {
  if (!response || typeof response !== "object") {
    return null;
  }
  const normalized = {
    ...response,
  };
  let expiresAt = toUnixMs(normalized.expires_at);

  if (!expiresAt && normalized.access_token) {
    const payload = decodeJwtPayload(normalized.access_token);
    expiresAt = toUnixMs(payload?.exp);
  }

  if (!expiresAt) {
    const expireInSeconds = Number(normalized.expire_in);
    if (Number.isFinite(expireInSeconds) && expireInSeconds > 0) {
      expiresAt = now + expireInSeconds * 1000;
    }
  }

  if (expiresAt) {
    normalized.expires_at = expiresAt;
  }

  return normalized;
}

function getStoredActivityAt() {
  if (!canUseWindow()) {
    return 0;
  }
  return Number(window.localStorage.getItem(LOGIN_ACTIVITY_KEY) || 0);
}

function setStoredActivityAt(activityAt) {
  if (!canUseWindow()) {
    return;
  }
  window.localStorage.setItem(LOGIN_ACTIVITY_KEY, `${activityAt}`);
}

function clearRefreshTimer() {
  if (refreshTimer) {
    window.clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function getRefreshThresholdMs(loginResponse) {
  const tokenLifetimeMs = Number(loginResponse?.expire_in || 0) * 1000;
  if (tokenLifetimeMs > 0) {
    return Math.max(MIN_REFRESH_THRESHOLD_MS, tokenLifetimeMs / 2);
  }
  return MIN_REFRESH_THRESHOLD_MS;
}

function getNormalizedRequestPath(requestUrl) {
  if (!canUseWindow()) {
    return requestUrl;
  }

  const resolvedUrl = new URL(requestUrl, window.location.origin);
  let pathname = resolvedUrl.pathname;
  const basePath =
    window.routerBase && window.routerBase !== "/"
      ? window.routerBase.replace(/\/$/, "")
      : "";

  if (basePath && pathname.startsWith(`${basePath}/`)) {
    pathname = pathname.slice(basePath.length);
  } else if (basePath && pathname === basePath) {
    pathname = "/";
  }

  return pathname;
}

function buildUrlWithBasePath(relativeUrl) {
  if (!canUseWindow() || /^(https?:)?\/\//.test(relativeUrl)) {
    return relativeUrl;
  }
  const basePath =
    window.routerBase && window.routerBase !== "/"
      ? window.routerBase.replace(/\/$/, "")
      : "";
  const cleanUrl = relativeUrl.replace(/^\//, "");
  return `${basePath}/${cleanUrl}`;
}

function isRefreshPath(requestUrl) {
  const path = getNormalizedRequestPath(requestUrl);
  return (
    path === REFRESH_ENDPOINT ||
    path === "/account/login" ||
    path === "/account/login/challenge" ||
    path === "/account/logout"
  );
}

function hasRecentUserActivity(now = Date.now()) {
  const lastActivityAt = getStoredActivityAt();
  return lastActivityAt > 0 && now-lastActivityAt <= ACTIVITY_IDLE_TIMEOUT_MS;
}

function dispatchLogout() {
  if (
    !canUseWindow() ||
    window.location.href.indexOf("user/login") !== -1 ||
    !window.g_app?._store
  ) {
    return;
  }
  window.g_app._store.dispatch({
    type: "login/logout",
    payload: {
      skipServerLogout: true,
    },
  });
}

function scheduleNextRefresh() {
  if (!canUseWindow()) {
    return;
  }
  clearRefreshTimer();
  const loginResponse = getStoredLoginResponse();
  const expiresAt = Number(loginResponse?.expires_at || 0);
  if (!loginResponse?.access_token || !expiresAt) {
    return;
  }

  const now = Date.now();
  const remainingMs = expiresAt - now;
  if (remainingMs <= 0) {
    return;
  }
  const refreshThresholdMs = getRefreshThresholdMs(loginResponse);

  const delayMs =
    remainingMs > refreshThresholdMs
      ? remainingMs - refreshThresholdMs
      : Math.min(REFRESH_RETRY_INTERVAL_MS, remainingMs);

  refreshTimer = window.setTimeout(() => {
    refreshTimer = null;
    if (!hasRecentUserActivity()) {
      scheduleNextRefresh();
      return;
    }
    refreshAccessToken().catch(() => {
      scheduleNextRefresh();
    });
  }, Math.max(1000, delayMs));
}

async function requestTokenRefresh(currentToken) {
  if (!canUseWindow() || !currentToken) {
    return null;
  }

  const refreshUrl = buildUrlWithBasePath(REFRESH_ENDPOINT);
  if (new URL(refreshUrl, window.location.origin).protocol !== "https:") {
    return null;
  }

  const response = await window.fetch(refreshUrl, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${currentToken}`,
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (e) {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(
      payload?.error?.reason || response.statusText || "failed to refresh token"
    );
    error.status = response.status;
    throw error;
  }

  return payload;
}

export function getStoredLoginResponse() {
  if (!canUseWindow()) {
    return null;
  }
  const parsed = parseJSON(window.localStorage.getItem(LOGIN_RESPONSE_KEY));
  const normalized = normalizeLoginResponse(parsed);
  if (!normalized?.access_token) {
    return null;
  }

  if (parsed?.expires_at !== normalized.expires_at) {
    window.localStorage.setItem(LOGIN_RESPONSE_KEY, JSON.stringify(normalized));
  }

  return normalized;
}

export function storeLoginResponse(response, { recordActivity = true } = {}) {
  if (!canUseWindow()) {
    return null;
  }
  const parsed =
    typeof response === "string"
      ? parseJSON(response)
      : response;

  if (!parsed?.access_token) {
    clearStoredLoginResponse();
    return null;
  }

  const normalized = normalizeLoginResponse(parsed);
  if (!normalized) {
    clearStoredLoginResponse();
    return null;
  }

  window.localStorage.setItem(LOGIN_RESPONSE_KEY, JSON.stringify(normalized));

  if (recordActivity) {
    setStoredActivityAt(Date.now());
  }

  scheduleNextRefresh();
  return normalized;
}

export function clearStoredLoginResponse() {
  if (!canUseWindow()) {
    return;
  }
  window.localStorage.removeItem(LOGIN_RESPONSE_KEY);
  window.localStorage.removeItem(LOGIN_ACTIVITY_KEY);
  clearRefreshTimer();
}

export function getAuthorizationToken() {
  return getStoredLoginResponse()?.access_token || "";
}

export function recordUserActivity({ force = false } = {}) {
  if (!canUseWindow() || !getStoredLoginResponse()?.access_token) {
    return;
  }

  const now = Date.now();
  if (!force && now - lastRecordedActivityAt < ACTIVITY_PERSIST_INTERVAL_MS) {
    return;
  }

  lastRecordedActivityAt = now;
  setStoredActivityAt(now);

  const loginResponse = getStoredLoginResponse();
  const refreshThresholdMs = getRefreshThresholdMs(loginResponse);
  if (
    loginResponse?.expires_at &&
    loginResponse.expires_at - now <= refreshThresholdMs
  ) {
    refreshAccessToken().catch(() => {});
    return;
  }

  scheduleNextRefresh();
}

export async function refreshAccessToken({ force = false } = {}) {
  const loginResponse = getStoredLoginResponse();
  if (!loginResponse?.access_token) {
    return null;
  }

  const now = Date.now();
  const expiresAt = Number(loginResponse.expires_at || 0);
  const refreshThresholdMs = getRefreshThresholdMs(loginResponse);
  if (
    !force &&
    (
      !expiresAt ||
      expiresAt - now > refreshThresholdMs ||
      !hasRecentUserActivity(now) ||
      now - lastRefreshAttemptAt < REFRESH_RETRY_INTERVAL_MS
    )
  ) {
    return loginResponse;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  lastRefreshAttemptAt = now;
  const previousToken = loginResponse.access_token;

  refreshPromise = requestTokenRefresh(previousToken)
    .then((response) => {
      if (response?.status === "ok" && response.access_token) {
        return storeLoginResponse(response, { recordActivity: false });
      }
      return getStoredLoginResponse();
    })
    .catch((error) => {
      const latest = getStoredLoginResponse();
      if (latest?.access_token && latest.access_token !== previousToken) {
        return latest;
      }
      if (Number(error?.status) === 401) {
        dispatchLogout();
        return null;
      }
      return latest;
    })
    .finally(() => {
      refreshPromise = null;
      scheduleNextRefresh();
    });

  return refreshPromise;
}

export function ensureFreshAccessToken(requestUrl) {
  if (!getStoredLoginResponse()?.access_token || isRefreshPath(requestUrl)) {
    return Promise.resolve(getStoredLoginResponse());
  }
  return refreshAccessToken();
}

export function startActivityAwareTokenRefresh() {
  if (!canUseWindow() || managerStarted) {
    return;
  }

  managerStarted = true;

  const handleActivity = () => {
    recordUserActivity();
  };

  ["mousedown", "keydown", "scroll", "touchstart", "mousemove"].forEach(
    (eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }
  );

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      recordUserActivity({ force: true });
      refreshAccessToken().catch(() => {});
    } else {
      scheduleNextRefresh();
    }
  });

  window.addEventListener("storage", (event) => {
    if (
      event.key === LOGIN_RESPONSE_KEY ||
      event.key === LOGIN_ACTIVITY_KEY
    ) {
      scheduleNextRefresh();
    }
  });

  scheduleNextRefresh();
}
