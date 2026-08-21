import { query as queryUsers, queryCurrent } from "@/services/user";
import { setCurrentUser } from "@/utils/CurrentUser";
import { reloadAuthorized } from "@/utils/Authorized";
import { syncAuthorityFromResponse } from "@/utils/authority";

function normalizeCurrentUser(payload) {
  const source = payload?._source || payload;
  if (!source || typeof source !== "object") {
    return {};
  }

  return {
    ...source,
    user_id: source.user_id || source.id || payload?._id || payload?.id,
    nick_name: source.nick_name || source.name,
  };
}

export default {
  namespace: "user",

  state: {
    list: [],
    currentUser: {},
  },

  effects: {
    *fetch(_, { call, put }) {
      const response = yield call(queryUsers);
      if (!response || response.error) {
        return;
      }
      yield put({
        type: "save",
        payload: response,
      });
    },
    *fetchCurrent(_, { call, put }) {
      const response = yield call(queryCurrent);
      if (response && !response.error) {
        syncAuthorityFromResponse(response);
        reloadAuthorized();
      }
      yield put({
        type: "saveCurrentUser",
        payload: response,
      });
      return response;
    },
  },

  reducers: {
    save(state, action) {
      return {
        ...state,
        list: action.payload,
      };
    },
    saveCurrentUser(state, action) {
      const currentUser = normalizeCurrentUser(action.payload);
      //update localStorage
      setCurrentUser(currentUser);

      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          ...currentUser,
        },
      };
    },
    changeNotifyCount(state, action) {
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          notifyCount: action.payload,
        },
      };
    },
  },
};
