import {getRebuildList,reindex, deleteRebuild}  from '@/services/rebuild';
import { message } from 'antd';
import {formatESSearchResult} from '@/lib/elasticsearch/util';


const delay = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export default {
  namespace: 'rebuildlist',
  state: {
    pageIndex: 1,
    pageSize: 10,
    isLoading: false,
  },
  effects:{
    *fetchRebuildList({payload}, {call, put}){
      yield put({
        type: 'saveData',
        payload: {
          isLoading: true,
        }
      })
      let resp = yield call(getRebuildList, {
        ...payload,
        from: (payload.pageIndex - 1) *  payload.pageSize,
        size: payload.pageSize,
      })
      if(!resp.status){
        message.error('fetch data failed')
        return
      }
      resp.payload = formatESSearchResult(resp.payload)
      yield put({
        type: 'saveData',
        payload: {
          ...payload,
          ...resp.payload,
          isLoading: false
        }
      })
    },
    *redoTask({payload}, {call, put, take}){
      yield put({
        type: 'saveData',
        payload: {
          isLoading: true,
        }
      })
      if(typeof payload.source._source ==='string' && payload.source._source != ''){
        payload.source._source = payload.source._source.split(',');
      }
      let resp = yield call(reindex, {
        name: 'redo ' + payload.name,
        desc: payload.desc,
        dest: payload.dest,
        source: payload.source,
      });
      if(resp.errno != "0"){
        message.error(resp.errmsg)
        return
      }
      message.success('requet submit success')
      yield call(delay, 1000);
      yield put({
        type: 'fetchRebuildList',
        payload: {
          pageIndex: 1,
          pageSize: 10
        }
      })
      yield take('b/@@fetchRebuildList')
  
      yield put({
        type: 'saveData',
        payload: {
          isLoading: false,
        }
      })
    },
    *deleteTask({payload}, {call, put, select}){
      yield put({
        type: 'saveData',
        payload: {
          isLoading: true,
        }
      })
      let resp = yield call(deleteRebuild, payload);
      if(resp.status === false){
        message.error("delete failed")
        return
      }
      let {data, total} = yield select(state=>state.rebuildlist);
      let newData = data.filter(item=> payload.id != item.id);
      yield put({
        type: 'saveData',
        payload: {
          data: newData,
          total: {
            ...total,
            value: total.value - payload.length,
          },
          isLoading: false,
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