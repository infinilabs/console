import { searchCommand, deleteCommand, saveCommand } from "@/services/command";
import { message } from "antd";
import { formatESSearchResult } from "@/lib/elasticsearch/util";

export default {
  namespace: "command",
  state: {},
  effects: {
    *fetchCommandList({ payload }, { call, put, select }) {
      let res = yield call(searchCommand, payload);
      if (res.error) {
        message.error(res.error);
        return false;
      }
      res = formatESSearchResult(res);
      yield put({
        type: "saveData",
        payload: res,
      });
    },

    *removeCommand({ payload }, { call, put, select }) {
      let res = yield call(deleteCommand, payload);
      if (res.error) {
        message.error(res.error);
        return false;
      }
      let { data, total } = yield select((state) => state.command);
      data = data.filter((item) => {
        return item.id !== payload.id;
      });
      yield put({
        type: "saveData",
        payload: {
          data,
          total: {
            ...total,
            value: total.value - 1,
          },
        },
      });
      return res;
    },

    *updateCommand({ payload }, { call, put, select }) {
      let res = yield call(saveCommand, payload);
      if (res.error) {
        message.error(res.error);
        return false;
      }
      // let {data, total} = yield select(state => state.command);
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
