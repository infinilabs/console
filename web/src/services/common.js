import $ from "jquery";

function getConfig() {
  const options = {
    url: "/config",
    cache: false,
    type: "GET",
    dataType: "json", // disable automatic guessing
    async: false,
  };
  let result = {};
  try {
    const text = $.ajax(options).responseText;
    result = JSON.parse(text);
  } catch (e) {
    console.warn("failed get config data");
  }
  return result;
}
const { api_endpoint } = getConfig();

let apiEndpoint = api_endpoint;
if (!apiEndpoint) {
  apiEndpoint = API_ENDPOINT;
  if (!API_ENDPOINT) {
    apiEndpoint = `${location.protocol}//${location.hostname}:2900`;
  }
}

export const pathPrefix = (apiEndpoint || "") + "/_search-center";
export function buildQueryArgs(params) {
  let argsStr = "";
  for (let key in params) {
    if (typeof params[key] !== "undefined") {
      argsStr += `${key}=${params[key]}&`;
    }
  }
  if (argsStr.length > 0) {
    argsStr = "?" + argsStr;
    argsStr = argsStr.slice(0, argsStr.length - 1);
  }
  return argsStr;
}
export const ESPrefix = (apiEndpoint || "") + "/elasticsearch";

export async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 5000 } = options;

  const controller = new AbortController();
  const id = setTimeout(() => {
    controller.abort();
  }, timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response.json();
  } catch (err) {
    return {
      error: "timeout",
    };
  }
}
