import {getDocList, saveDoc, deleteDoc, addDoc}  from '@/services/doc';
import {getMappings, getIndices} from '@/services/indices';
import {formatESSearchResult} from '@/lib/elasticsearch/util';
import { message } from 'antd';
import moment from "moment";

function encodeObjectField(doc){
  for(let key of Object.keys(doc)){
    if(typeof doc[key] == 'object'){
      if(doc[key] instanceof moment){
        doc[key] = doc[key].toJSON();
        continue;
      }
      doc[key] = JSON.stringify(doc[key]);
    }
  }
  return doc;
}

function decodeObjectField(doc){
  for(let key of Object.keys(doc)){
    if(!doc[key]){
      continue;
    }
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
    resultKey: '',
    tableMode: 'JSON',
  },
  effects: {
    *fetchDocList({payload}, {call, put, select}){
      yield put({
        type: 'saveData',
        payload: {
          isLoading: true,
        }
      });
      let res = yield call(getDocList, _.clone(payload));
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
      const {tableMode} = yield select(state=>state.document);
      res.payload = formatESSearchResult(res.payload);
      let indices = []; //indices state can remove
      if(res.payload.data && res.payload.data.length > 0){
        for(let doc of res.payload.data){
          if(!indices.includes(doc._index)){
            indices.push(doc._index);
          }
          if(tableMode !== "JSON") {
            encodeObjectField(doc);
          }
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
          resultKey: indices[0] || '',
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
      const {tableMode} = yield select(state=>state.document);
      if(tableMode !== 'JSON') {
        if (decodeObjectField(doc) === false) {
          return;
        }
      }
      let res = yield call(saveDoc, payload);
      if(res.status === false){
        message.warn("保存数据失败")
        yield put({
          type: 'saveData',
          payload: {
            editingKey: '',
            isLoading: false,
            _index: ''
          }
        })
        return
      }
      if(tableMode !== 'JSON') {
        encodeObjectField(doc);
      }
      //console.log(payload.data);
      yield put({
        type: '_saveDocItem',
        payload: {
          docItem: payload.data,
          id: payload._id,
          extra: {
            editingKey: '',
            isLoading: false,
            editValue: null,
            _index: ''
          }
        } 
      });
      message.success("保存数据成功");
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
          id: payload._id,
          extra: {
            isLoading: false,
          }
        } 
      })
      message.success("删除数据成功")
    },
    *addDocItem({payload},{call, put, select}) {
      yield put({
        type: 'saveData',
        payload: {
          isLoading: true,
        }
      });
      const {tableMode} = yield select(state => state.document);
      if (tableMode !== 'JSON') {
        if (decodeObjectField(payload.data) === false) {
          return;
        }
      }
      let res = yield call(addDoc, payload);
      if (res.status === false) {
        message.warn("添加文档失败")
        return
      }
      if (tableMode !== 'JSON') {
        encodeObjectField(res.payload);
      }
      res.payload['_index'] = payload._index;
      res.payload['_type'] = payload._type;
      yield put({
        type: '_addNew',
        payload: {
          docItem: res.payload,
          extra: {
            isLoading: false,
            isAddNew: false,
            editValue: null,
          }
        } 
      });
      message.success("添加文档成功")
    },
    *fetchIndices({payload}, {call, put}){
      let resp = yield call(getIndices, payload)
      if(resp.error){
        message.warn("获取数据失败")
        return
      }
      yield put({
        type: 'saveData', 
        payload: {
          clusterIndices: resp,
        }
      })
    },
    *fetchMappings({payload}, {call, put}){
      let resp = yield call(getMappings, payload);
      if(resp.error){
        message.warn("get mappings failed")
        return
      }
      yield put({
        type: 'saveData',
        payload: {
          mappings: resp,
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
        return item.id === payload.id;
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
        return item.id === payload.id;
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
        let data = state.data || [];
        data.unshift(payload.docItem);
        return {
          ...state,
          data: data,
          ...payload.extra,
        }
      }else{
        if(state.tableMode !=='JSON') {
          state.data[0] = payload.docItem;
        }else{
          state.data.unshift(payload.docItem);
        }
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