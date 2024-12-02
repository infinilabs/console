import $ from "jquery";

export const pathPrefix = "/_search-center";
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
export const ESPrefix = "/elasticsearch";

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
