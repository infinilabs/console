import {getAliasList, doAlias } from '@/services/alias';

export default {
  namespace: 'alias',

  state: {
  },
  effects: {
    *fetchAliasList({ payload }, { call, put }) {
      const res = yield call(getAliasList, payload);
      let aliasList = [];
      for(let k in res){
        aliasList.push(res[k]);
      }
      yield put({
        type: 'saveData',
        payload: {
          aliasList,
        }
      })
    },
    *add({ payload, callback }, { call, put }) {

    },
    *update({ payload }, { call, put }) {
      const res = yield call(doAlias, {
        clusterID: payload.clusterID,
        data: {
          actions: [{
            add: {
             ...payload.actionBody
            }
          }]
        },
      })
      if(res.acknowledged){
        yield put({
          type:'fetchAliasList',
          payload: {
            clusterID: payload.clusterID,
          }
        })
      }
      return res;
    },
    *delete({ payload }, { call, put }) {
      let removeBody = {
        alias: payload.alias,
      };
      if(payload.indices){
        removeBody['indices'] = payload.indices;
      }else{
        removeBody['index'] = payload.index;
      }

      const res = yield call(doAlias, {
        clusterID: payload.clusterID,
        data: {
          actions: [{
            remove: removeBody,
          }]
        },
      })
      if(res.acknowledged){
        yield put({
          type:'fetchAliasList',
          payload: {
            clusterID: payload.clusterID,
          }
        })
      }
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
