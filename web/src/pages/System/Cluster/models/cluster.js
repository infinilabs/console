import {
  createClusterConfig,
  searchClusterConfig,
  updateClusterConfig,
  deleteClusterConfig,
  tryConnect,
  getClusterConfig,
} from "@/services/cluster";
import { message } from "antd";
import { formatESSearchResult } from "@/lib/elasticsearch/util";

export default {
  namespace: "clusterConfig",
  state: {
    editMode: "",
    editValue: {},
    pageSize: 20,
    current: 1,
  },
  effects: {
    *fetchClusterList({ payload }, { call, put, select }) {
      let res = yield call(searchClusterConfig, payload);
      if (res.error) {
        message.error(res.error);
        return false;
      }
      res = formatESSearchResult(res);
      const { clusterStatus } = yield select((state) => state.clusterConfig);
      // for(let item of res.data){
      //   item.status= clusterStatus[item.id]
      // }
      yield put({
        type: "saveData",
        payload: {
          ...res,
          current: payload.current,
        },
      });
    },
    *fetchCluster({ payload }, { call, put, select }) {
      let res = yield call(getClusterConfig, payload);
      if (res.error) {
        message.error(res.error);
        return false;
      }
      yield put({
        type: "saveData",
        payload: {
          editValue: {
            ...res._source,
            id: res._id,
          },
        },
      });
      return res;
    },
    *addCluster({ payload }, { call, put, select }) {
      let res = yield call(createClusterConfig, payload);
      if (res.error) {
        message.error(res.error);
        return false;
      }
      let { data, total } = yield select((state) => state.clusterConfig);
      if (!data) {
        return;
      }
      data.unshift({
        ...res._source,
        id: res._id,
      });
      yield put({
        type: "saveData",
        payload: {
          data,
          total: {
            ...total,
            value: total.value + 1,
          },
        },
      });
      yield put({
        type: "global/addCluster",
        payload: {
          ...res._source,
          id: res._id,
        },
      });
      return res;
    },
    *updateCluster({ payload }, { call, put, select }) {
      let res = yield call(updateClusterConfig, payload);
      if (res.error) {
        message.error(res.error);
        return false;
      }
      let { data } = yield select((state) => state.clusterConfig);
      if (data) {
        let idx = data.findIndex((item) => {
          return item.id === res._id;
        });
        data[idx] = {
          ...data[idx],
          ...res._source,
        };
        yield put({
          type: "saveData",
          payload: {
            data,
          },
        });
      }

      //handle global cluster logic

      yield put({
        type: "global/updateCluster",
        payload: {
          id: res._id,
          name: res._source.name,
          monitored: res._source.monitored,
        },
      });
      return res;
    },
    *deleteCluster({ payload }, { call, put, select }) {
      let res = yield call(deleteClusterConfig, payload);
      if (res.error) {
        message.error(res.error);
        return false;
      }
      let { data, total } = yield select((state) => state.clusterConfig);
      data = data.filter((item) => {
        return item.id !== payload.id;
      });
      yield put({
        type: "saveData",
        payload: {
          data,
          total: {
            ...total,
            value: total.value + 1,
          },
        },
      });
      yield put({
        type: "global/removeCluster",
        payload: {
          id: payload.id,
        },
      });
      return res;
    },
    *doTryConnect({ payload }, { call, put, select }) {
      let res = yield call(tryConnect, payload);
      if (res.error) {
        message.error(res.error);
        return false;
      }

      yield put({
        type: "saveData",
        payload: {
          tempClusterInfo: res,
        },
      });
      return res;
    },
  },
  reducers: {
    saveData(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
  },
};
