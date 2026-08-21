import { stringify } from "qs";
import request, { formatResponse } from "@/utils/request";

const normalizeAuthResponse = async (response) => {
  if (!response || typeof response.text !== "function") {
    if (response && typeof response === "object") {
      return response;
    }

    return {
      status: "error",
      success: false,
      error: {
        reason: typeof response === "string" && response ? response : "",
      },
    };
  }

  let payload = {};
  const body = await response.text();
  if (body) {
    try {
      payload = JSON.parse(body);
    } catch (error) {
      payload = {
        error: {
          reason: body,
        },
      };
    }
  }

  const normalized = formatResponse({
    ...payload,
    status: payload?.status || (response.ok ? "ok" : "error"),
    success:
      typeof payload?.success === "boolean" ? payload.success : response.ok,
  });

  if (!normalized?.error && !response.ok) {
    normalized.error = {
      reason: payload?.message || response.statusText || `HTTP ${response.status}`,
    };
  }

  return {
    ...normalized,
    httpStatus: response.status,
  };
};

export async function queryConsoleInfo() {
  return request("/_info");
}

export async function queryProjectNotice() {
  return request("/api/project/notice");
}

export async function queryActivities() {
  return request("/api/activities");
}

export async function queryRule(params) {
  return request(`/api/rule?${stringify(params)}`);
}

export async function removeRule(params) {
  return request("/api/rule", {
    method: "POST",
    body: {
      ...params,
      method: "delete",
    },
  });
}

export async function addRule(params) {
  return request("/api/rule", {
    method: "POST",
    body: {
      ...params,
      method: "post",
    },
  });
}

export async function updateRule(params) {
  return request("/api/rule", {
    method: "POST",
    body: {
      ...params,
      method: "update",
    },
  });
}

export async function fakeSubmitForm(params) {
  return request("/api/forms", {
    method: "POST",
    body: params,
  });
}

export async function fakeChartData() {
  return request("/api/fake_chart_data");
}

export async function queryTags() {
  return request("/api/tags");
}

export async function queryBasicProfile() {
  return request("/api/profile/basic");
}

export async function queryAdvancedProfile() {
  return request("/api/profile/advanced");
}

export async function queryFakeList(params) {
  return request(`/api/fake_list?${stringify(params)}`);
}

export async function removeFakeList(params) {
  const { count = 5, ...restParams } = params;
  return request(`/api/fake_list?count=${count}`, {
    method: "POST",
    body: {
      ...restParams,
      method: "delete",
    },
  });
}

export async function addFakeList(params) {
  const { count = 5, ...restParams } = params;
  return request(`/api/fake_list?count=${count}`, {
    method: "POST",
    body: {
      ...restParams,
      method: "post",
    },
  });
}

export async function updateFakeList(params) {
  const { count = 5, ...restParams } = params;
  return request(`/api/fake_list?count=${count}`, {
    method: "POST",
    body: {
      ...restParams,
      method: "update",
    },
  });
}

export async function fakeAccountLogin(params) {
  const response = await request(
    "/account/login",
    {
      method: "POST",
      body: params,
      skipAuthRedirect: true,
    },
    true,
    false
  );

  return normalizeAuthResponse(response);
}

export async function getAccountLoginChallenge(params) {
  const response = await request(
    "/account/login/challenge",
    {
      method: "POST",
      body: params,
      skipAuthRedirect: true,
    },
    true,
    false
  );

  return normalizeAuthResponse(response);
}

export async function fakeAccountLogout() {
  return request(
    "/account/logout",
    {
      method: "POST",
      skipAuthRedirect: true,
    },
    false,
    false
  );
}

export async function fakeRegister(params) {
  return request("/api/register", {
    method: "POST",
    body: params,
  });
}

export async function queryNotices(params) {
  return request("/notification/_search", {
    method: "POST",
    body: params,
  });
}

export async function clearNotices(params) {
  return request("/notification/read", {
    method: "POST",
    body: params,
  });
}

export async function getFakeCaptcha(mobile) {
  return request(`/api/captcha?mobile=${mobile}`);
}
