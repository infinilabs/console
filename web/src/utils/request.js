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
    const jsonRes = await response.clone().json();
    if (jsonRes.error && !jsonRes.stack) {
      if (noticeable) {
        let desc = "";
        if (typeof jsonRes.error == "string") {
          desc = jsonRes.error;
        } else {
          if (jsonRes.error?.reason) {
            desc = (
              <div style={{ color: "rgba(153,153,153,1)" }}>
                {jsonRes.error.reason}
              </div>
            );
          } else {
            desc = JSON.stringify(jsonRes.error);
          }
        }
        desc = (
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
            {desc}
          </div>
        );
        notification.error({
          message: formatMessage({ id: "app.message.http.request.error" }),
          description: desc,
          style: { wordBreak: "break-all" },
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
    notification.error({
      message: response.statusText,
      description: errortext,
      style: { wordBreak: "break-all" },
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
      notification.error({
        message: `${formatMessage({ id: "app.message.http.request.error" })}`,
        description: desc,
        style: { wordBreak: "break-all" },
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
  if (
    newOptions.method === "POST" ||
    newOptions.method === "PUT" ||
    newOptions.method === "DELETE"
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

  return (
    fetch(url, newOptions)
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
          err.message = "Failed to connnect server";
          if (typeof setGlobalHealth === "function") {
            setGlobalHealth({
              error: err.name,
              desc: err.message,
            });
          }
          return err;
        }

        if (status === "AbortError") {
          if (noticeable) {
            notification.error({
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
            });
          }
          return;
        }

        if (location.href.indexOf("guide/initialization") === -1) {
          if (status === 401) {
            // @HACK
            /* eslint-disable no-underscore-dangle */
            if (location.href.indexOf("user/login") === -1) {
              window.g_app._store.dispatch({
                type: "login/logout",
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
      })
  );
}
