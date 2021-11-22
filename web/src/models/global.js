import { queryNotices } from "@/services/api";
import { message } from "antd";
import { searchClusterConfig, getClusterStatus } from "@/services/cluster";
import {
  formatESSearchResult,
  extractClusterIDFromURL,
} from "@/lib/elasticsearch/util";
import { Modal } from "antd";
import router from "umi/router";
import _ from "lodash";
import ReactGA from "react-ga";
ReactGA.initialize("G-L0XH1C4CVP");

const MENU_COLLAPSED_KEY = "search-center:menu:collapsed";

export default {
  namespace: "global",

  state: {
    collapsed: localStorage.getItem(MENU_COLLAPSED_KEY) === "true",
    isInitCollapsed: false,
    notices: [],
    clusterVisible: true,
    clusterList: [],
    selectedCluster: { name: "Select cluster", id: "" },
    selectedClusterID: "",
    search: {
      cluster: {},
    },
  },

  effects: {
    *fetchNotices(_, { call, put }) {
      const data = yield call(queryNotices);
      yield put({
        type: "saveNotices",
        payload: data,
      });
      yield put({
        type: "user/changeNotifyCount",
        payload: data.length,
      });
    },
    *clearNotices({ payload }, { put, select }) {
      yield put({
        type: "saveClearedNotices",
        payload,
      });
      const count = yield select((state) => state.global.notices.length);
      yield put({
        type: "user/changeNotifyCount",
        payload: count,
      });
    },
    *fetchClusterList({ payload }, { call, put, select }) {
      let res = yield call(searchClusterConfig, payload);
      if (res.error) {
        message.error(res.error);
        return false;
      }
      res = formatESSearchResult(res);
      let { clusterList, search } = yield select((state) => state.global);
      let data = res.data
        .filter((item) => item.enabled)
        .map((item) => {
          return {
            name: item.name,
            id: item.id,
            endpoint: item.endpoint,
            host: item.host,
            version: item.version,
          };
        });

      if (clusterList.length === 0 && !payload.name) {
        if (data.length === 0) {
          Modal.info({
            title: "系统提示",
            content:
              "当前没有可用集群，点击确定将自动跳转到 系统设置=>集群设置",
            okText: "确定",
            onOk() {
              router.push("/system/cluster");
            },
          });
        } else {
          const targetID = extractClusterIDFromURL();
          let idx = data.findIndex((item) => {
            return item.id == targetID;
          });
          idx = idx > -1 ? idx : 0;
          yield put({
            type: "saveData",
            payload: {
              selectedCluster: data[idx],
              selectedClusterID: (data[idx] || {}).id,
            },
          });
        }
      }
      let newClusterList = [];
      if (search.name != payload.name) {
        newClusterList = data;
      } else {
        newClusterList = clusterList.concat(data);
      }
      yield put({
        type: "saveData",
        payload: {
          clusterList: newClusterList,
          clusterTotal: res.total,
          search: {
            ...search,
            cluster: payload,
          },
        },
      });
      return data;
    },
    *reloadClusterList({ payload }, { call, put, select }) {
      yield put({
        type: "saveData",
        payload: {
          clusterList: [],
        },
      });
      yield put({
        type: "fetchClusterList",
        payload: payload,
      });
    },
    *changeClusterState({ payload }, { put }) {
      yield put({
        type: "saveData",
        payload: {
          ...payload,
        },
      });
    },
    *rewriteURL({ payload }, { select, put }) {
      const { pathname, history, search, isChangedState } = payload;
      const global = yield select((state) => state.global);
      if (pathname && global.selectedClusterID) {
        const newPart = `/elasticsearch/${global.selectedClusterID}/`;
        if (!pathname.includes("elasticsearch")) {
          history.replace(pathname + newPart + (search || ""));
        } else {
          const ms = pathname.match(/\/elasticsearch\/(\w+)\/?/);
          if (ms && ms.length > 1 && ms[1] != global.selectedClusterID) {
            if (isChangedState) {
              const newPath = pathname.replace(
                /\/elasticsearch\/(\w+)\/?/,
                newPart
              );
              history.replace(newPath + (search || ""));
              return;
            }
            yield put({
              type: "changeClusterById",
              payload: {
                id: ms[1],
              },
            });
          }
        }
      }
    },
    *fetchClusterStatus({ payload }, { call, put, select }) {
      let res = yield call(getClusterStatus, payload);
      if (!res) {
        return false;
      }
      const { clusterStatus } = yield select((state) => state.global);
      if (res.error) {
        console.log(res.error);
        return false;
      }
      if (!_.isEqual(res, clusterStatus)) {
        yield put({
          type: "saveData",
          payload: {
            clusterStatus: res,
          },
        });
      }
      return res;
    },
  },

  reducers: {
    changeLayoutCollapsed(state, { payload }) {
      //layout sider init(false) bug
      if (!state.isInitCollapsed && state.collapsed) {
        return {
          ...state,
          isInitCollapsed: true,
        };
      }
      localStorage.setItem(MENU_COLLAPSED_KEY, payload);
      return {
        ...state,
        collapsed: payload,
        isInitCollapsed: true,
      };
    },
    saveNotices(state, { payload }) {
      return {
        ...state,
        notices: payload,
      };
    },
    saveClearedNotices(state, { payload }) {
      return {
        ...state,
        notices: state.notices.filter((item) => item.type !== payload),
      };
    },
    saveData(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },

    removeCluster(state, { payload }) {
      let newState = {
        ...state,
        clusterList: state.clusterList.filter((item) => item.id !== payload.id),
      };
      if (state.selectedCluster?.id === payload.id) {
        if (newState.clusterList.length > 0) {
          newState.selectedCluster = newState.clusterList[0];
          newState.selectedClusterID = newState.selectedCluster.id;
        }
      }
      return newState;
    },
    addCluster(state, { payload }) {
      if (state.clusterList.length === 0) {
        state.selectedCluster = payload;
        state.selectedClusterID = payload.id;
      }
      state.clusterList.push(payload);
      return state;
    },
    updateCluster(state, { payload }) {
      let idx = state.clusterList.findIndex((item) => item.id === payload.id);
      idx > -1 && (state.clusterList[idx].name = payload.name);
      return state;
    },
    changeClusterById(state, { payload }) {
      let idx = state.clusterList.findIndex((item) => item.id === payload.id);
      if (idx > -1) {
        return {
          ...state,
          selectedCluster: state.clusterList[idx],
          selectedClusterID: state.clusterList[idx].id,
        };
      }
      return state;
    },
  },

  subscriptions: {
    setup({ history, dispatch }) {
      // Subscribe history(url) change, trigger `load` action if pathname is `/`
      return history.listen(({ pathname, search }) => {
        let clusterVisible = true;
        const clusterHiddenPath = [
          "/system",
          "/cluster/overview",
          "/alerting/overview",
          "/alerting/monitor/monitors/",
          "/alerting/destination",
          "/dev_tool",
        ];
        if (clusterHiddenPath.some((p) => pathname.startsWith(p))) {
          clusterVisible = false;
          if (pathname.includes("elasticsearch")) {
            dispatch({
              type: "rewriteURL",
              payload: {
                pathname,
                history,
                search,
              },
            });
          }
        } else {
          if (
            !pathname.startsWith("/exception") &&
            pathname != "/alerting/monitor"
          ) {
            dispatch({
              type: "rewriteURL",
              payload: {
                pathname,
                history,
                search,
              },
            });
          }
        }
        dispatch({
          type: "saveData",
          payload: {
            clusterVisible,
          },
        });
        ReactGA.pageview(pathname + search);
      });
    },
  },
};
