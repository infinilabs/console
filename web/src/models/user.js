import { query as queryUsers, queryCurrent } from "@/services/user";
import { setCurrentUser, getCurrentUser } from "@/utils/CurrentUser";

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
      yield put({
        type: "saveCurrentUser",
        payload: response,
      });
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
      //update localStorage
      if (action.payload && action.payload._source) {
        setCurrentUser(action.payload._source);
      }

      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          ...(action.payload._source || {}),
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
