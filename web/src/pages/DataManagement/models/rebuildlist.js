import {getRebuildList}  from '@/services/rebuild';
import { message } from 'antd';

export default {
  namespace: 'rebuildlist',
  state: {
  },
  effects:{
    *fetchRebuildList({payload}, {call, put}){
      let resp = yield call(getRebuildList, payload)
      yield put({
        type: 'saveData',
        payload: resp.payload 
      })
    }
  },
  reducers: {
    saveData(state, {payload}){
      return {
        ...state,
        ...payload,
      }
    }
  }
}