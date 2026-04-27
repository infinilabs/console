import fetch from "dva/fetch";
import { notification } from "antd";
import router from "umi/router";
import hash from "hash.js";
import { isAntdPro } from "./utils";
import { formatMessage } from "umi/locale";
import { getAuthorizationHeader } from "./authority";
import * as uuid from 'uuid';

export const formatResponse = (response) => {
  if (!response || !response.error) return response;
  let key;
  let msg;
  if (response.error.reason === 'context deadline exceeded') {
    key = 'error.timeout'
  } else {
    const errors = response.error.reason?.split(':');
    const errorKey = errors[0]?.endsWith('_error') ? errors[0] : 'unknown';
    const field = errors[1]
    key = errorKey !== 'unknown' && errors[1] ? `error.${errorKey}.${errors[1]}` : `error.${errorKey}`;
    msg = errors.slice(2).join(':')
  }

  return {
    ...response,
    errorObject: {
      id: uuid.v4(),
      key,
      msg
    }
  }
}

const secureTransportErrorReason =
  "Sensitive requests require HTTPS. Enable Console HTTPS or put Console behind an HTTPS reverse proxy.";
const ERROR_NOTIFICATION_DEDUPE_MS = 4000;
const recentErrorNotifications = new Map();

const sensitiveRequestRules = [
  { method: "POST", pattern: /^\/account\/login\/challenge$/ },
  { method: "POST", pattern: /^\/account\/login$/ },
  { method: "PUT", pattern: /^\/account\/password$/ },
  { method: "POST", pattern: /^\/user$/ },
  { method: "PUT", pattern: /^\/user\/[^/]+\/password$/ },
  { method: "POST", pattern: /^\/credential$/ },
  { method: "PUT", pattern: /^\/credential\/[^/]+$/ },
  { method: "POST", pattern: /^\/setup\/_validate$/ },
  { method: "POST", pattern: /^\/setup\/_initialize$/ },
  { method: "POST", pattern: /^\/setup\/_validate_secret$/ },
  { method: "POST", pattern: /^\/elasticsearch\/$/ },
  { method: "PUT", pattern: /^\/elasticsearch\/[^/]+$/ },
  { method: "POST", pattern: /^\/elasticsearch\/try_connect$/ },
  { method: "POST", pattern: /^\/email\/server$/ },
  { method: "POST", pattern: /^\/email\/server\/_test$/ },
  { method: "PUT", pattern: /^\/email\/server\/[^/]+$/ },
  { method: "PUT", pattern: /^\/setting\/system\/rollup$/ },
  { method: "PUT", pattern: /^\/setting\/system\/retention$/ },
];

const getNormalizedRequestPath = (requestUrl) => {
  if (typeof window === "undefined") {
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
};

const requestUsesSecureTransport = (requestUrl) => {
  if (typeof window === "undefined") {
    return true;
  }

  return new URL(requestUrl, window.location.origin).protocol === "https:";
};

const requestRequiresSecureTransport = (requestUrl, method = "GET") => {
  const normalizedMethod = method.toUpperCase();
  const normalizedPath = getNormalizedRequestPath(requestUrl);

  return sensitiveRequestRules.some(
    ({ method: sensitiveMethod, pattern }) =>
      sensitiveMethod === normalizedMethod && pattern.test(normalizedPath)
  );
};

const getInsecureTransportResponse = () => ({
  status: "error",
  success: false,
  currentAuthority: "guest",
  error: {
    reason: secureTransportErrorReason,
  },
});

const cleanupRecentErrorNotifications = (now = Date.now()) => {
  recentErrorNotifications.forEach((timestamp, key) => {
    if (now - timestamp >= ERROR_NOTIFICATION_DEDUPE_MS) {
      recentErrorNotifications.delete(key);
    }
  });
};

const showErrorNotification = ({
  message,
  description,
  style,
  dedupeKey,
}) => {
  const now = Date.now();
  cleanupRecentErrorNotifications(now);
  const key = dedupeKey || `${message}`;
  const lastShownAt = recentErrorNotifications.get(key);
  if (lastShownAt && now - lastShownAt < ERROR_NOTIFICATION_DEDUPE_MS) {
    return;
  }
  recentErrorNotifications.set(key, now);
  notification.error({
    key,
    placement: "topRight",
    message,
    description,
    style,
  });
};

const fetchReplayNonce = async (requestUrl, requestMethod, authorizationHeader) => {
  const nonceEndpoint = buildUrlWithBasePath("/account/replay_nonce");
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json; charset=utf-8",
  };
  if (authorizationHeader) {
    headers.Authorization = authorizationHeader;
  }

  const response = await fetch(nonceEndpoint, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({
      method: requestMethod,
      path: getNormalizedRequestPath(requestUrl),
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok || !payload?.nonce) {
    const reason =
      payload?.error?.reason ||
      payload?.message ||
      "failed to fetch replay nonce";
    throw new Error(reason);
  }

  return payload.nonce;
};

const checkStatus = async (response, noticeable, option={}) => {
  const codeMessage = {
    200: formatMessage({ id: "app.message.http.status.200" }),
    201: formatMessage({ id: "app.message.http.status.201" }),
    202: formatMessage({ id: "app.message.http.status.202" }),
    204: formatMessage({ id: "app.message.http.status.204" }),
    400: formatMessage({ id: "app.message.http.status.400" }),
    401: formatMessage({ id: "app.message.http.status.401" }),
    403: formatMessage({ id: "app.message.http.status.403" }),
    404: formatMessage({ id: "app.message.http.status.404" }),
    406: formatMessage({ id: "app.message.http.status.406" }),
    410: formatMessage({ id: "app.message.http.status.410" }),
    422: formatMessage({ id: "app.message.http.status.422" }),
    500: formatMessage({ id: "app.message.http.status.500" }),
    502: formatMessage({ id: "app.message.http.status.502" }),
    503: formatMessage({ id: "app.message.http.status.503" }),
    504: formatMessage({ id: "app.message.http.status.504" }),
  };

  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  if (response.status == 500) {
    let jsonRes = null;
    try {
      jsonRes = await response.clone().json();
    } catch (error) {
      jsonRes = null;
    }
    if (jsonRes?.error && !jsonRes.stack) {
      if (noticeable) {
        const friendlyMessage = jsonRes.error?.key
          ? formatMessage({ id: jsonRes.error.key })
          : formatMessage({ id: "app.message.http.status.500" });
        const desc = (
          <div>
            <div>
              <span
                style={{
                  background: "#eaeaea",
                  fontSize: 12,
                  padding: "3px",
                  borderRadius: 3,
                }}
              >
                {response.status}
              </span>
            </div>
            <div style={{ color: "rgba(153,153,153,1)" }}>
              {friendlyMessage}
            </div>
          </div>
        );
        showErrorNotification({
          message: formatMessage({ id: "app.message.http.request.error" }),
          description: desc,
          style: { wordBreak: "break-all" },
          dedupeKey: `http-500:${jsonRes.error?.key || jsonRes.error?.reason || friendlyMessage}`,
        });
      }
      return response;
    }
  }
  const errortext = codeMessage[response.status] || response.statusText;

  if (
    noticeable &&
    option.hasOwnProperty("showErrorInner") &&
    option.showErrorInner === true
  ) {
    showErrorNotification({
      message: response.statusText,
      description: errortext,
      style: { wordBreak: "break-all" },
      dedupeKey: `http-inner:${response.status}:${response.statusText}:${errortext}`,
    });
    return response;
  }

  if (
    response.status != 500 &&
    response.status != 403 &&
    response.status != 401
  ) {
    console.log("response.status:", response.status);
    if (noticeable) {
      let desc = (
        <div>
          <div>
            <span
              style={{
                background: "#eaeaea",
                fontSize: 12,
                padding: "3px",
                borderRadius: 3,
              }}
            >
              {response.status}
            </span>
          </div>
          {errortext}
        </div>
      );
      showErrorNotification({
        message: `${formatMessage({ id: "app.message.http.request.error" })}`,
        description: desc,
        style: { wordBreak: "break-all" },
        dedupeKey: `http-status:${response.status}:${errortext}`,
      });
    }
  }

  const error = new Error(errortext);
  error.name = response.status;
  error.response = response.statusText;
  error.rawResponse = response;
  throw error;
};

const cachedSave = (response, hashcode) => {
  /**
   * Clone a response data and store it in sessionStorage
   * Does not support data other than json, Cache only json
   */
  const contentType = response.headers.get("Content-Type");
  if (contentType && contentType.match(/application\/json/i)) {
    // All data is saved as text
    response
      .clone()
      .text()
      .then((content) => {
        sessionStorage.setItem(hashcode, content);
        sessionStorage.setItem(`${hashcode}:timestamp`, Date.now());
      });
  }
  return response;
};

/**
 * Builds a full URL by prepending the application's routerBase.
 * It handles various path formats gracefully.
 *
 * @param {string} relativeUrl - The relative URL path (e.g., '/api/users' or 'api/status').
 * @returns {string} The full, correctly formed URL.
 */
const buildUrlWithBasePath = (relativeUrl) => {
  // 1. Check if the URL is absolute. If so, don't modify it.
  // This handles cases like 'http://...', 'https://...', or '//...'.
  if (/^(https?:)?\/\//.test(relativeUrl)) {
    return relativeUrl;
  }

  // 2. Get the basePath from the global window object.
  // Default to an empty string if it's not set or is just '/'.
  const basePath = (window.routerBase && window.routerBase !== '/')
    ? window.routerBase
    : '';

  // 3. Clean up paths to prevent double slashes.
  const cleanBase = basePath.replace(/\/$/, ''); // Remove trailing slash from base
  const cleanUrl = relativeUrl.replace(/^\//, ''); // Remove leading slash from url

  // 4. Combine them and return.
  return `${cleanBase}/${cleanUrl}`;
}

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [option] The options we want to pass to "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export default function request(
  url,
  option,
  returnRawResponse = false,
  noticeable = true
) {
  url = buildUrlWithBasePath(url);
  if (option?.queryParams && Object.keys(option.queryParams).length > 0) {
    let separator = "?";
    if (url.indexOf(separator) > -1) {
      separator = "&";
    }
    url +=
      separator +
      Object.entries(option.queryParams)
        .map((kvs) => kvs.join("="))
        .join("&");
  }
  const options = {
    expirys: isAntdPro(),
    ...option,
  };
  /**
   * Produce fingerprints based on url and parameters
   * Maybe url has the same parameters
   */
  const fingerprint = url + (options.body ? JSON.stringify(options.body) : "");
  const hashcode = hash
    .sha256()
    .update(fingerprint)
    .digest("hex");

  const controller = new AbortController();
  const signal = controller.signal;

  if (!option?.ignoreTimeout) {
    let timeout = 60; //60s
    let minTimeout = 1; //1s
    if (option?.timeout && option.timeout >= minTimeout) {
      timeout = option.timeout;
    } else {
      let localTimeout = localStorage.getItem("timeout");
      if (localTimeout && localTimeout > minTimeout) {
        timeout = localTimeout;
      } else {
        localStorage.setItem("timeout", timeout);
      }
    }
  
    setTimeout(() => {
      controller.abort();
    }, timeout * 1000);
  }

  const defaultOptions = {
    credentials: "include",
    signal,
  };
  const newOptions = { ...defaultOptions, ...options };
  const requestMethod = (newOptions.method || "GET").toUpperCase();
  if (
    requestMethod === "POST" ||
    requestMethod === "PUT" ||
    requestMethod === "DELETE"
  ) {
    if (!(newOptions.body instanceof FormData)) {
      newOptions.headers = {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
        ...newOptions.headers,
      };
      if (typeof newOptions.body != "string")
        newOptions.body = JSON.stringify(newOptions.body);
    } else {
      // newOptions.body is FormData
      newOptions.headers = {
        Accept: "application/json",
        ...newOptions.headers,
      };
    }
  }

  newOptions.headers = {
    "Accept-Encoding": "gzip, deflate, br",
    ...newOptions.headers,
  };
  const authorizationHeader = getAuthorizationHeader();
  if (authorizationHeader) {
    newOptions.headers["Authorization"] = authorizationHeader;
  }

  const requiresSecureTransport = requestRequiresSecureTransport(url, requestMethod);
  if (requiresSecureTransport && !requestUsesSecureTransport(url)) {
    if (noticeable) {
      showErrorNotification({
        message: "HTTPS required",
        description: secureTransportErrorReason,
        style: { wordBreak: "break-all" },
        dedupeKey: `https-required:${getNormalizedRequestPath(url)}`,
      });
    }
    return Promise.resolve(getInsecureTransportResponse());
  }

  const expirys = options.expirys && 60;
  // options.expirys !== false, return the cache,
  if (options.expirys !== false) {
    const cached = sessionStorage.getItem(hashcode);
    const whenCached = sessionStorage.getItem(`${hashcode}:timestamp`);
    if (cached !== null && whenCached !== null) {
      const age = (Date.now() - whenCached) / 1000;
      if (age < expirys) {
        const response = new Response(new Blob([cached]));
        return response.json();
      }
      sessionStorage.removeItem(hashcode);
      sessionStorage.removeItem(`${hashcode}:timestamp`);
    }
  }

  const sendRequest = (nonce) => {
    if (nonce) {
      newOptions.headers["X-Request-Nonce"] = nonce;
    }
    return fetch(url, newOptions)
      .then((res) => checkStatus(res, noticeable, option))
      // .then(response => cachedSave(response, hashcode))
      .then((response) => {
        // DELETE and 204 do not return data by default
        // using .json will report an error.
        if (returnRawResponse) {
          return response;
        }
        // if (newOptions.method === "DELETE" || response.status === 204) {
        //   return response.text();
        // }
        return response.json();
      })
      .catch((e) => {
        const status = e.name;
        if (status == "TypeError") {
          //connection refused
          const err = new Error();
          err.name = "ERR_CONNECTION_REFUSED";
          err.message = formatMessage({
            id: "error.request.connection_refused",
          });
          if (typeof setGlobalHealth === "function") {
            setGlobalHealth({
              error: err.name,
              desc: formatMessage({
                id: "error.request.connection_refused.tip",
              }),
            });
          }
          return err;
        }

        if (status === "AbortError") {
          if (noticeable) {
            showErrorNotification({
              message: formatMessage({
                id: "app.message.http.request.timeout",
              }),
              description:
                formatMessage({
                  id: "app.message.description.http.request.timeout",
                }) +
                "\r\nURL:" +
                url,
              style: { wordBreak: "break-all" },
              dedupeKey: `request-timeout:${url}`,
            });
          }
          return;
        }

        if (location.href.indexOf("guide/initialization") === -1) {
          if (status === 401) {
            // @HACK
            /* eslint-disable no-underscore-dangle */
            if (
              option?.skipAuthRedirect !== true &&
              location.href.indexOf("user/login") === -1
            ) {
              window.g_app._store.dispatch({
                type: "login/logout",
                payload: {
                  skipServerLogout: true,
                },
              });
            }
          }
          // environment should not be used
          if (status === 403) {
            if (location.href.includes('/insight/dashboard') && url.includes('/visualization/data')) {
              return e.rawResponse;
            }
            router.push("/exception/403");
          }
          if (status == 500) {
            router.push({
              pathname: "/exception/500",
              state: e.response,
            });
          }
          // if (status >= 404 && status < 422) {
          //   router.push("/exception/404");
          // }
        }

        if (returnRawResponse) {
          return e.rawResponse;
        }
        return e.response;
      });
  };

  const noncePromise = requiresSecureTransport
    ? fetchReplayNonce(url, requestMethod, authorizationHeader)
    : Promise.resolve(null);

  const handleNonceError = (error) => {
    if (noticeable) {
      showErrorNotification({
        message: "Request rejected",
        description: error?.message || "failed to fetch replay nonce",
        style: { wordBreak: "break-all" },
        dedupeKey: `request-rejected:${getNormalizedRequestPath(url)}:${error?.message || "failed to fetch replay nonce"}`,
      });
    }
    return getInsecureTransportResponse();
  };

  return noncePromise.then((nonce) => sendRequest(nonce), handleNonceError);
}
