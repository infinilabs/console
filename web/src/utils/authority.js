import request from "./request";

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
  return localStorage.getItem("infini-auth");
}

export function isLogin() {
  const responseStr = localStorage.getItem("login-response");
  if (responseStr) {
    let loginResponse = null;
    try {
      loginResponse = JSON.parse(responseStr);
      if (loginResponse?.username && loginResponse?.status == "ok") {
        return true;
      }
    } catch (err) {
      console.error(err);
    }
  }
  return false;
}

export function getAuthorizationHeader() {
  const responseStr = localStorage.getItem("login-response");
  if (responseStr) {
    let loginResponse = null;
    try {
      loginResponse = JSON.parse(responseStr);
    } catch (err) {
      console.error(err);
    }
    if (loginResponse) {
      return "Bearer " + loginResponse.access_token;
    }
  }
  return "";
}

export function getRollupEnabled() {
  return localStorage.getItem("infini-rollup-enabled");
}

(async function() {
  const res = await request("/setting/application");
  if (res && !res.error) {
    localStorage.setItem("infini-auth", res.auth_enabled);
    localStorage.setItem('infini-rollup-enabled', res.system_cluster?.rollup_enabled || false)
  }
})();
