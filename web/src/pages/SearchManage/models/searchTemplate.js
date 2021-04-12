import { getTemplateList,addTemplate,updateTemplate,deleteTemplate } from '@/services/searchTemplate';
import { message } from 'antd';

export default {
  namespace: 'searchTemplate',

  state: {
    list: [],
    pagination: {
      from:0,
      size:10
    },
    total:0,
  },

  effects: {
    *fetchList({ payload }, { call, put }) {
      const res = yield call(getTemplateList, payload);
      console.log("fetchList response:",res);
      if (res.hits) {
        let newList = [];
        let hits = res.hits.hits;
        for (let item of hits) {
          item._source.id = item._id;
          newList.push(item._source);
        }
        console.log("fetchList list:",newList);
        yield put({
          type: 'save',
          payload: {
            list:newList,
            total:res.hits.total.value,
          },
        });
      } else {
        message.warning(res.msg);
      }
    },
    *add({ payload, callback }, { call, put }) {
      const res = yield call(addTemplate, payload);
      console.log("add res:",res);
      //业务数据格式化处理
      if (res.result === 'created') {
        let item = res._source;
        item.id = res._id;

        yield put({
          type: 'create',
          payload: {
            item:item
          },
        });
      } else {
        message.warning(res.msg);
      }

      if (callback) callback();
    },
    *update({ payload, callback }, { call, put }) {
      const res = yield call(updateTemplate, payload);
      console.log("update res:",res);
      //业务数据格式化处理
      if (res.result === 'updated') {
        console.log("update successful");
      }

      if (callback) callback();
    },
    *delete({ payload, callback }, { call, put }) {
      const payloadNew = {...payload};
      if (Array.isArray(payload.id)) {
        payloadNew.id = payload.id.toString();
      }
      let res = yield call(deleteTemplate, payloadNew);
      res = JSON.parse(res);//这个接口返回的res不是对象而是json字符串？？
      console.log("deleted res:",res);
      //业务数据格式化处理
      if (res.result === 'deleted') {
        const item = {};
        item.id = res._id;

        yield put({
          type: 'del',
          payload: {
            item:item
          },
        });
      } else {
        message.warn("deleted failure")
      }

      if (callback) callback();
    },
  },

  reducers: {
    save(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
    create(state, {payload}){
      console.log("create payload:",payload);
      let list = state.list || [];
      list.unshift(payload.item);
      return {
        ...state,
        list:list,
        total: state.total + 1,
      };
    },
    del(state, {payload}){
      console.log("del payload:",payload);
      let list = state.list;
      let idx = state.list.findIndex((item)=>{
        return item.id === payload.item.id;
      })
      idx > -1 && (state.list.splice(idx, 1));
      return {
        ...state,
        total: state.total - 1,
      }
    },
  },
};
