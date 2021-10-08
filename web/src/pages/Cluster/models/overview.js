import {searchClusterConfig} from "@/services/cluster";
import {getOverview} from "@/services/overview";
import {message} from "antd";
import {formatESSearchResult} from '@/lib/elasticsearch/util';

export default {
    namespace: 'clusterOverview',
    state: {
      
    },
    effects:{
      *fetchClusterList({payload}, {call, put, select}){
        let res = yield call(searchClusterConfig, payload);
        if(res.error){
          message.error(res.error)
          return false;
        }
        res = formatESSearchResult(res);
        yield put({
          type: 'saveData',
          payload: {
            clusterList: res,
          }
        })
      },
      *fetchOverview({}, {call, put}){
        let res = yield call(getOverview);
        if(res.error){
          message.error(res.error)
          return false;
        }
        yield put({
          type: 'saveData',
          payload: {
            overview: res,
          }
        })
      }
    },
    reducers:{
        saveData(state, {payload}){
            return {
                ...state,
                ...payload
            };
        },
    }
};
