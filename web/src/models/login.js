import { routerRedux } from "dva/router";
import { stringify } from "qs";
import { fakeAccountLogin, getFakeCaptcha } from "@/services/api";
import { setAuthority } from "@/utils/authority";
import { getPageQuery } from "@/utils/utils";
import { reloadAuthorized } from "@/utils/Authorized";
import * as CurrentUser from "@/utils/CurrentUser";
import { getAuthEnabled } from "@/utils/authority";

export default {
  namespace: "login",

  state: {
    status: undefined,
  },

  effects: {
    *login({ payload }, { call, put }) {
      const response = yield call(fakeAccountLogin, payload);
      yield put({
        type: "changeLoginStatus",
        payload: response,
      });
      // Login successfully
      if (response.status === "ok") {
        setAuthority(response.privilege);
        reloadAuthorized();
        if (getAuthEnabled()) {
          yield put({
            type: "global/saveData",
            payload: {
              clusterStatus: null,
            },
          });
        }
        localStorage.setItem("login-response", JSON.stringify(response));
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

    *logout(_, { put }) {
      yield put({
        type: "changeLoginStatus",
        payload: {
          status: false,
          currentAuthority: "guest",
        },
      });
      localStorage.removeItem("login-response");
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
    },
  },

  reducers: {
    changeLoginStatus(state, { payload }) {
      setAuthority(payload.currentAuthority);
      return {
        ...state,
        status: payload.status,
        type: payload.type,
      };
    },
  },
};
