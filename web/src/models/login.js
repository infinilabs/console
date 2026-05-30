import { routerRedux } from "dva/router";
import { stringify } from "qs";
import {
  fakeAccountLogin,
  fakeAccountLogout,
  getAccountLoginChallenge,
  getFakeCaptcha,
} from "@/services/api";
import {
  getAuthEnabled,
  setAuthority,
  syncAuthorityFromResponse,
} from "@/utils/authority";
import { getPageQuery } from "@/utils/utils";
import { reloadAuthorized } from "@/utils/Authorized";
import * as CurrentUser from "@/utils/CurrentUser";
import { buildPasswordProof } from "@/utils/password";
import {
  clearStoredLoginResponse,
  storeLoginResponse,
} from "@/utils/auth_session";
import { formatMessage } from "umi/locale";

let logoutInProgress = false;

const invalidCredentialReasons = [
  "invalid login or password",
  "invalid username or password",
  "authentication_exception",
  "user not found",
];

const getLoginErrorMessage = (response) => {
  const reason = response?.error?.reason || response?.message || "";
  const normalizedReason = String(reason || "").toLowerCase();

  if (normalizedReason === "invalid bootstrap password") {
    return formatMessage({
      id: "guide.initialization.finish.error.invalid_bootstrap_password",
    });
  }

  if (
    [401, 403].includes(response?.httpStatus) ||
    invalidCredentialReasons.some((item) => normalizedReason.includes(item))
  ) {
    return formatMessage({ id: "app.login.message-invalid-credentials" });
  }

  if (response?.errorObject?.key) {
    return formatMessage({
      id: response.errorObject.key,
      defaultMessage:
        reason || formatMessage({ id: "app.login.message-invalid-credentials" }),
    });
  }

  return reason || formatMessage({ id: "app.login.message-invalid-credentials" });
};

const normalizeLoginResponse = (response, type) => {
  if (response?.status === "ok") {
    return response;
  }

  return {
    ...(response && typeof response === "object" ? response : {}),
    status: "error",
    type,
    message: getLoginErrorMessage(response),
  };
};

export default {
  namespace: "login",

  state: {
    status: undefined,
    message: "",
  },

  effects: {
    *login({ payload }, { call, put }) {
      const username = payload.username || payload.userName;
      let loginPayload = payload;
      let response;

      try {
        const challenge = yield call(getAccountLoginChallenge, { username });

        if (challenge?.status === "ok" && challenge?.method === "challenge") {
          const proof = yield call(buildPasswordProof, {
            password: payload.password,
            username,
            challengeId: challenge.challenge_id,
            nonce: challenge.nonce,
            salt: challenge.salt,
            iterations: challenge.iterations,
          });
          loginPayload = {
            userName: username,
            type: payload.type,
            challenge_id: challenge.challenge_id,
            proof,
          };
        } else if (challenge?.status === "ok" && challenge?.method === "plain") {
          // Legacy accounts keep using the original password payload until the backend upgrades verifier data.
          loginPayload = payload;
        }

        response = yield call(fakeAccountLogin, loginPayload);
      } catch (error) {
        response = {
          status: "error",
          error: {
            reason: error?.message || "",
          },
        };
      }

      response = normalizeLoginResponse(response, payload.type);
      yield put({
        type: "changeLoginStatus",
        payload: response,
      });
      // Login successfully
      if (response.status === "ok") {
        syncAuthorityFromResponse(response);
        reloadAuthorized();
        if (getAuthEnabled()) {
          yield put({
            type: "global/saveData",
            payload: {
              clusterStatus: null,
            },
          });
        }
        storeLoginResponse(response);
        const urlParams = new URL(window.location.href);
        const params = getPageQuery();
        let { redirect } = params;
        if (redirect) {
          const redirectUrlParams = new URL(redirect);
          if (redirectUrlParams.origin === urlParams.origin) {
            redirect = redirect.substr(urlParams.origin.length);
            // if (redirect.startsWith("/#")) {
            //   redirect = redirect.substr(2);
            // }
          }
          window.location.href = redirect;
          return;
        }
        // yield put(routerRedux.replace(redirect || "/"));
        window.location.href = "/";
      }
    },

    *getCaptcha({ payload }, { call }) {
      yield call(getFakeCaptcha, payload);
    },

    *logout({ payload = {} }, { call, put }) {
      if (logoutInProgress) {
        return;
      }
      logoutInProgress = true;
      try {
        if (payload.skipServerLogout !== true) {
          yield call(fakeAccountLogout);
        }
        yield put({
          type: "changeLoginStatus",
          payload: {
            status: false,
            currentAuthority: "guest",
          },
        });
        clearStoredLoginResponse();
        reloadAuthorized();
        //clear selected cluster state
        yield put({
          type: "global/saveData",
          payload: {
            selectedClusterID: null,
          },
        });
        yield put(
          routerRedux.push({
            pathname: "/user/login",
            search: stringify({
              redirect: window.location.href,
            }),
          })
        );
      } finally {
        logoutInProgress = false;
      }
    },
  },

  reducers: {
    changeLoginStatus(state, { payload }) {
      if (typeof payload?.currentAuthority !== "undefined") {
        setAuthority(payload.currentAuthority);
      }
      return {
        ...state,
        status: payload.status,
        type: payload.type,
        message: payload.message || "",
      };
    },
  },
};
