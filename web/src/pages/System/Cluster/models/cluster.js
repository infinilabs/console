import {createClusterConfig,searchClusterConfig, updateClusterConfig,deleteClusterConfig} from "@/services/clusterConfig";
import {message} from "antd";
import {formatESSearchResult} from '@/lib/elasticsearch/util';

export default {
  namespace: 'clusterConfig',
  state: {
    editMode: '',
    editValue: {},
  },
  effects:{
    *fetchClusterList({payload}, {call, put}){
      let res = yield call(searchClusterConfig, payload);
      if(res.error){
        message.error(res.error)
        return false;
      }
      res = formatESSearchResult(res)
      yield put({
        type: 'saveData',
        payload: res
      })
    },
    *addCluster({payload}, {call, put, select}) {
      let res = yield call(createClusterConfig, payload)
      if(res.error){
        message.error(res.error)
        return false;
      }
      return res;
    },
    *updateCluster({payload}, {call, put, select}) {
      let res = yield call(updateClusterConfig, payload)
      if(res.error){
        message.error(res.error)
        return false;
      }
      return res;
    },
    *deleteCluster({payload}, {call, put, select}) {
      let res = yield call(deleteClusterConfig, payload)
      if(res.error){
        message.error(res.error)
        return false;
      }
      let {data, total} = yield select(state => state.clusterConfig);
      data = data.filter((item)=>{
        return item.id !== payload.id;
      })
      yield put({
        type: 'saveData',
        payload: {
          data,
          total: total -1,
        }
      })
      return res;
    }
  },
  reducers:{
    saveData(state, {payload}){
      return {
        ...state,
        ...payload,
      }
    }
  }
}