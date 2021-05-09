import { queryNotices } from '@/services/api';
import {message} from "antd";
import {searchClusterConfig} from "@/services/cluster";
import {formatESSearchResult} from '@/lib/elasticsearch/util';
import {Modal} from 'antd';
import router from "umi/router";


export default {
  namespace: 'global',

  state: {
    collapsed: false,
    notices: [],
    clusterVisible: true,
    clusterList: [],
    selectedCluster: {name:"Select cluster", id: ""},
    selectedClusterID: "",
  },

  effects: {
    *fetchNotices(_, { call, put }) {
      const data = yield call(queryNotices);
      yield put({
        type: 'saveNotices',
        payload: data,
      });
      yield put({
        type: 'user/changeNotifyCount',
        payload: data.length,
      });
    },
    *clearNotices({ payload }, { put, select }) {
      yield put({
        type: 'saveClearedNotices',
        payload,
      });
      const count = yield select(state => state.global.notices.length);
      yield put({
        type: 'user/changeNotifyCount',
        payload: count,
      });
    },
    *fetchClusterList({payload}, {call, put, select}){
      let res = yield call(searchClusterConfig, payload);
      if(res.error){
        message.error(res.error)
        return false;
      }
      res = formatESSearchResult(res)
      let clusterList = yield select(state => state.global.clusterList);
      let data = res.data.filter(item=>item.enabled).map((item)=>{
        return {
          name: item.name,
          id: item.id,
        };
      })

      if(clusterList.length === 0){
        if(data.length === 0 ){
          Modal.info({
            title: '系统提示',
            content: '当前没有可用集群，点击确定将自动跳转到 系统设置=>集群设置',
            okText: '确定',
            onOk() {
              router.push('/system/cluster')
            },
          });
        }else{
          yield put({
            type: 'saveData',
            payload:{
              selectedCluster: data[0],
              selectedClusterID: (data[0] || {}).id
            }
          });
        }
      }

      yield put({
        type: 'saveData',
        payload: {
          clusterList: clusterList.concat(data),
        }
      })
      return data;
    },
    *reloadClusterList({payload}, {call, put, select}){
      yield put({
        type: 'saveData',
        payload: {
          clusterList: [],
        }
      });
      yield put({
        type: 'fetchClusterList',
        payload: payload
      })
    }
  },

  reducers: {
    changeLayoutCollapsed(state, { payload }) {
      return {
        ...state,
        collapsed: payload,
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
        notices: state.notices.filter(item => item.type !== payload),
      };
    },
    saveData(state, {payload}){
      return {
        ...state,
        ...payload,
      }
    },

    removeCluster(state, {payload}){
      return {
        ...state,
        clusterList: state.clusterList.filter(item => item.id !== payload.id)
      }
    },
    addCluster(state, {payload}){
      state.clusterList.push(payload)
      return state;
    },
    updateCluster(state, {payload}){
      let idx = state.clusterList.findIndex(item => item.id === payload.id);
      idx > -1 && (state.clusterList[idx].name = payload.name);
      return state;
    },
    changeClusterById(state,{payload}){
      let idx = state.clusterList.findIndex(item => item.id === payload.id);
      if(idx > -1){
        return {
          ...state,
          selectedCluster: state.clusterList[idx],
          selectedClusterID: state.clusterList[idx].id,
        }
      }
      return state;
    }
  },

  subscriptions: {
    setup({ history, dispatch }) {
      // Subscribe history(url) change, trigger `load` action if pathname is `/`
      return history.listen(({ pathname, search }) => {
        let clusterVisible = true;
        if(pathname.startsWith("/system")){
          clusterVisible = false;
        }
        dispatch({
          type: 'saveData',
          payload: {
            clusterVisible,
          }
        })
        if (typeof window.ga !== 'undefined') {
          window.ga('send', 'pageview', pathname + search);
        }
      });
    },
  },
};
