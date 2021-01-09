import {getDocList, saveDoc, deleteDoc, addDoc}  from '@/services/doc';
import {getMappings, getIndices} from '@/services/indices';
import {formatESSearchResult} from '@/utils/elasticsearch';
import { message } from 'antd';

function encodeObjectField(doc){
  //let rawData = {};
  for(let key of Object.keys(doc)){
    if(typeof doc[key] == 'object'){
      // let docId = doc['id'];
      // !rawData[docId] && (rawData[docId] = {});
      // rawData[docId][key] = doc[key];
      doc[key] = JSON.stringify(doc[key]);
    }
  }
  return doc;
}

function decodeObjectField(doc){
  for(let key of Object.keys(doc)){
    if(['[', '{'].includes(doc[key][0])){
      try{
        doc[key] = JSON.parse(doc[key])
      }catch(e){
        message.warn(key +': json format error');
        return false;
      }
    }
  }
  return doc;
}

export default {
  namespace: "document",
  state: {
    index: '',
    editingKey: '',
    isLoading: false,
  },
  effects: {
    *fetchDocList({payload}, {call, put}){
      yield put({
        type: 'saveData',
        payload: {
          isLoading: true,
        }
      });
      let res = yield call(getDocList, payload);
      if(res.status === false){
        message.warn("加载数据失败")
        yield put({
          type: 'saveData',
          payload:{
            isLoading: false,
          }
        })
        return
      }
      res.payload = formatESSearchResult(res.payload);
      let indices = []; //indices state can remove
      if(res.payload.data && res.payload.data.length > 0){
        for(let doc of res.payload.data){
          if(!indices.includes(doc._index)){
            indices.push(doc._index);
          }
           encodeObjectField(doc);
        }
      }
      yield put({
        type: 'saveData',
        payload: {
          pageIndex: payload.pageIndex,
          pageSize: payload.pageSize,
          isLoading: false,
          index: payload.index,
          indices,
          cluster: payload.cluster || '',
          filter: payload.filter || '',
          ...res.payload,
        }
      })
    },
    *saveDocItem({payload}, {call, put, select}){
      yield put({
        type: 'saveData',
        payload: {
          isLoading: true,
        }
      });
      let doc = payload.data;
      //let {rawData} = yield select(state => state.document);
      if(decodeObjectField(doc) === false){
        return;
      }
      let res = yield call(saveDoc, payload);
      if(res.status === false){
        message.warn("保存数据失败")
        return
      }
      encodeObjectField(doc);
      yield put({
        type: '_saveDocItem',
        payload: {
          docItem: payload.data,
          extra: {
            editingKey: '',
            isLoading: false,
            _index: ''
          }
        } 
      })
    },
    *deleteDocItem({payload}, {call, put}){
      yield put({
        type: 'saveData',
        payload: {
          isLoading: true,
        }
      });
      let res = yield call(deleteDoc, payload);
      if(typeof res == 'string'){
        res = JSON.parse(res);
      }
      if(res.status === false){
        message.warn("删除数据失败")
        return
      }
      yield put({
        type: '_deleteDocItem',
        payload: {
          docItem: payload.data,
          extra: {
            isLoading: false,
          }
        } 
      })
    },
    *addDocItem({payload},{call, put}){
      yield put({
        type: 'saveData',
        payload: {
          isLoading: true,
        }
      });
      if(decodeObjectField(payload.data) === false){
        return;
      }
      let res = yield call(addDoc, payload);
      if(res.status === false){
        message.warn("添加文档失败")
        return
      }
      encodeObjectField(res.payload);
      res.payload['_index'] = payload.index;
      yield put({
        type: '_addNew',
        payload: {
          docItem: res.payload,
          extra: {
            isLoading: false,
            isAddNew: false,
          }
        } 
      })
    },
    *fetchIndices({payload}, {call, put}){
      let resp = yield call(getIndices)
      if(resp.status === false){
        message.warn("获取数据失败")
        return
      }
      yield put({
        type: 'saveData', 
        payload: {
          clusterIndices: resp.payload,
          cluster: payload.cluster,
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
    },
    _saveDocItem(state, {payload}){
      let idx = state.data.findIndex((item) => {
        return item.id == payload.docItem.id;
      });
      idx > -1 && (state.data[idx] = {
        ...state.data[idx],
        ...payload.docItem,
      })
      
      return {
        ...state,
        ...payload.extra,
      };
    },
    _deleteDocItem(state, {payload}){ 
      let idx = state.data.findIndex((item) => {
        return item.id == payload.docItem.id;
      });
      state.data.splice(idx, 1);
      return {
        ...state,
        ...payload.extra,
        total: {
          ...state.total,
          value: state.total.value-1
        }
      };
    },
    _addNew(state, {payload}){
      if(payload.extra && payload.extra.isAddNew){
        if(!state.data){
          state.data = [];
        }
        state.data.unshift(payload.docItem)
        return {
          ...state,
          ...payload.extra,
        }
      }else{
        state.data[0] = payload.docItem;
        return {
          ...state,
          ...payload.extra,
          total: {
            ...state.total,
            value: state.total.value + 1
          }
        }
      }
    },
    cancelNew(state,{payload}){
      state.data.shift()
      return {
        ...state,
        isAddNew: false,
      }
    }
  }
}