import {
  queryNotices,
  clearNotices,
  queryConsoleInfo,
} from "@/services/api";
import { message } from "antd";
import { searchClusterConfig, getClusterStatus } from "@/services/cluster";
import {
  formatESSearchResult,
  extractClusterIDFromURL,
} from "@/lib/elasticsearch/util";
import { Modal, Icon } from "antd";
import router from "umi/router";
import _ from "lodash";
import { getAuthEnabled, hasAuthority } from "@/utils/authority";
import { formatMessage } from "umi/locale";

// import ReactGA from "react-ga";
// ReactGA.initialize("G-L0XH1C4CVP");

const MENU_COLLAPSED_KEY = "search-center:menu:collapsed";
const COUSOLE_VERSION_KEY = "console:version";
const CLUSTER_STATUS_CACHE_TTL = 60 * 1000;
const CONSOLE_WELCOME_BANNER_STYLE =
  "color:#1677ff;font-size:14px;font-weight:700;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;";

const formatBuildDate = (value) => {
  if (!value) {
    return value;
  }

  const buildDate = new Date(value);
  if (Number.isNaN(buildDate.getTime())) {
    return value;
  }

  return buildDate.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });
};

export default {
  namespace: "global",

  state: {
    collapsed: localStorage.getItem(MENU_COLLAPSED_KEY) === "true",
    isInitCollapsed: false,
    notices: [],
    clusterVisible: true,
    clusterList: [],
    clusterStatus: {},
    clusterStatusFetchedAt: 0,
    selectedCluster: {},
    selectedClusterID: null,
    search: {
      cluster: {},
    },
    consoleInfo: {},
    consoleLicence: { loading: true },
  },

  effects: {
    *fetchNotices(_, { call, put }) {
      let nitices = [];
      let notifyCount = 0;
      let queryParams = {
        from: 0,
        size: 10,
        status: ["new"],
      };
      const data = yield call(queryNotices, queryParams);
      if (data?.hits?.total?.value > 0) {
        notifyCount = data.hits.total.value;
        nitices = data.hits.hits.map((item) => {
          let _source = item._source;
          _source.read = _source.status == "new" ? false : true;
          _source.datetime = _source.created;
          return item._source;
        });
      }
      yield put({
        type: "saveNotices",
        payload: nitices,
      });
      yield put({
        type: "user/changeNotifyCount",
        payload: notifyCount,
      });
    },
    *clearNotices({ payload }, { call, put, select }) {
      const response = yield call(clearNotices, payload);
      // clear successfully
      if (response?.acknowledged !== true) {
        message.error(res.error);
        return false;
      }
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
    *fetchClusterList({ payload }, { call, put, select, take }) {
      try {
        let res = yield call(searchClusterConfig, payload);

        if (!res) {
          message.error("No response from cluster service");
          return false;
        }

        if (res.error) {
          message.error(String("Error: " + (res.error.reason || res.error.message || res.error)));
          return false;
        }

        res = formatESSearchResult(res);

        let { clusterList, search, selectedClusterID } = yield select(
          (state) => state.global
        );

        let data = res.data
          .filter((item) => item.enabled)
          .map((item) => ({
            ...item,
            distribution: item.distribution || "elasticsearch",
            cluster_uuid: item.cluster_uuid || "",
          }));

        if (clusterList.length === 0 && !payload.name) {
          if (data.length === 0 && location.href.indexOf("user/login") === -1) {
            if (getAuthEnabled() && !hasAuthority("system.cluster:all")) {
              Modal.info({
                title: formatMessage({ id: "app.message.system-tips" }),
                content: formatMessage({
                  id:
                    "app.message.system-tips.no-available-cluster-data-permission",
                }),
                okText: formatMessage({ id: "form.button.ok" }),
              });
              return;
            }
            Modal.info({
              title: formatMessage({ id: "app.message.system-tips" }),
              content: formatMessage({
                id:
                  "app.message.system-tips.no-available-cluster-redirect-setting",
              }),
              okText: formatMessage({ id: "form.button.ok" }),
              onOk() {
                router.push("/resource/cluster");
              },
            });
          }
        }

        if (!selectedClusterID) {
          const targetID = extractClusterIDFromURL();
          let idx = data.findIndex((item) => item.id == targetID);

          if (idx === -1) {
            yield put({ type: "fetchClusterStatus" });
            yield take("fetchClusterStatus/@@end");
            let { clusterStatus } = yield select((state) => state.global);
            idx = data.findIndex((item) => clusterStatus[item.id]?.available);
            if (idx === -1) idx = 0;
          }

          yield put({
            type: "saveData",
            payload: {
              selectedCluster: data[idx],
              selectedClusterID: (data[idx] || {}).id,
            },
          });
        }

        let newClusterList = search.name !== payload.name
          ? data
          : clusterList.concat(data);

        yield put({
          type: "saveData",
          payload: {
            clusterList: newClusterList,
            clusterTotal: res.total,
            search: { ...search, cluster: payload },
          },
        });

        return data;
      } catch (err) {
        message.error(err.message || "Unknown error occurred while fetching clusters");
        return false;
      }
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
      if (pathname.startsWith("/exception")) {
        return;
      }

      const dataToolsNewMatch = pathname.match(
        /^\/data_tools\/(migration|comparison)\/new(?:\/elasticsearch\/[^/]+\/?)?$/
      );
      if (dataToolsNewMatch) {
        const normalizedPath = `/data_tools/${dataToolsNewMatch[1]}/new`;
        if (pathname !== normalizedPath) {
          history.replace(normalizedPath + (search || ""));
        }
        return;
      }
      
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
      if (location.href.indexOf("#/user/login") > -1) {
        return false;
      }
      const options = payload || {};
      const { force = false, maxAge = CLUSTER_STATUS_CACHE_TTL } = options;
      const { clusterStatus, clusterStatusFetchedAt } = yield select(
        (state) => state.global
      );

      if (
        !force &&
        clusterStatusFetchedAt > 0 &&
        Date.now() - clusterStatusFetchedAt < maxAge
      ) {
        return clusterStatus;
      }

      let res = yield call(getClusterStatus);
      if (!res) {
        return false;
      }
      if (res.error) {
        console.log(res.error);
        return false;
      }
      const nextPayload = {
        clusterStatusFetchedAt: Date.now(),
      };
      if (!_.isEqual(res, clusterStatus)) {
        nextPayload.clusterStatus = res;
      }
      if (Object.keys(nextPayload).length > 0) {
        yield put({
          type: "saveData",
          payload: nextPayload,
        });
      }
      return res;
    },

    *fetchConsoleInfo(_, { call, put }) {
      const data = yield call(queryConsoleInfo);
      if (data && data.hasOwnProperty("application")&& data?.application.hasOwnProperty("version")) {
        const localVersionInfoVal = localStorage.getItem(COUSOLE_VERSION_KEY);
        localStorage.setItem(COUSOLE_VERSION_KEY, JSON.stringify(data?.application?.version));
        const localVersionInfo =
          (localVersionInfoVal && JSON.parse(localVersionInfoVal)) || {};
        if (
          localVersionInfo.build_hash &&
          localVersionInfo.build_hash != data?.application?.version?.build_hash
        ) {
          console.log("The Console version has changed! auto refresh");
          window.location.reload(true);
          return;
        }

        //please do not delete
        console.log(`%cWelcome to ${APP_TITLE}!`, CONSOLE_WELCOME_BANNER_STYLE);
        console.log("version:", data?.application?.version?.number);
        console.log("build_number:", data?.application?.version?.build_number);
        console.log("build_hash:", data?.application?.version?.build_hash);
        console.log("build_date:",
          formatBuildDate(data?.application?.version?.build_date)
        );
      } else {
        console.log("fetch console info failed, ", data);
        return false;
      }
      yield put({
        type: "saveConsoleInfo",
        payload: data,
      });
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
        notices: state.notices.filter((item) => {
          // item.type !== payload.type
          if (_.isArray(payload.ids) && payload.ids.length > 0) {
            return payload.ids.indexOf(item.id) === -1;
          } else if (_.isArray(payload.types) && payload.types.length > 0) {
            return payload.types.indexOf(item.type) === -1;
          }
          return true;
        }),
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
      if (state.selectedCluster?.id === payload.id) {
        state.selectedCluster = {
          ...(state.selectedCluster || {}),
          ...(payload || {})
        }
      }
      state.clusterStatus[payload.id].config.monitored = payload.monitored;
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
    saveConsoleInfo(state, { payload }) {
      return {
        ...state,
        consoleInfo: payload,
      };
    },
    saveConsoleLicence(state, { payload }) {
      return {
        ...state,
        consoleLicence: payload,
      };
    },
  },

  subscriptions: {
    setup({ history, dispatch }) {
      // Subscribe history(url) change, trigger `load` action if pathname is `/`
      return history.listen(({ pathname, search }) => {
        let clusterVisible = true;
        const clusterHiddenPath = [
          "/overview",
          "/system",
          "/cluster/monitor",
          "/cluster/overview",
          "/alerting/overview",
          "/alerting/monitor/monitors/",
          "/alerting/destination",
          "/alerting/rule",
          "/alerting/alert",
          "/alerting/message",
          "/alerting/channel",
          "/dev_tool",
          "/devtool",
          "/gateway",
          "/user",
          "/cluster/activities",
          "/admin",
          "/account",
          "/agent",
          "/guide",
          "/resource",
          "/platform/notification",
        ];
        if (clusterHiddenPath.some((p) => pathname.startsWith(p))) {
          clusterVisible = false;
          if (pathname === '/cluster/monitor' || pathname.startsWith('/cluster/monitor/elasticsearch')){
            clusterVisible = true;
          }
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
            pathname != "/alerting/monitor" &&
            pathname != "/"
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
        // ReactGA.pageview(pathname + search);
      });
    },
  },
};
