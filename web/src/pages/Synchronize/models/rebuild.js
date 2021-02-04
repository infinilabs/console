import {reindex} from '@/services/rebuild';
import {getMappings} from '@/services/indices';
import { message } from 'antd';

export default {
  namespace: 'rebuild',
  state: {
    currentStep: 0,
    selectedSourceIndex:'',
    configData: {
      source:{},
      dest:{},
    },
  },
  effects:{
    *addTask({payload}, {call, put}){
      let resp = yield call(reindex, payload);
      if(!resp.status){
        message.warn("rebuild failed")
        return
      }
      message.info("submit succeed")
      yield put({
        type: 'saveData',
        payload: {
          currentStep: 0,
          configData: {
            source:{},
            dest:{},
          },
        }
      })
    },
    *fetchMappings({payload}, {call, put}){
      let resp = yield call(getMappings, payload);
      if(resp.status === false){
        message.warn("get mappings failed")
        return
      }
      yield put({
        type: 'saveData',
        payload: {
          mappings: resp.payload,
        }
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