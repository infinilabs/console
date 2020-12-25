import { message } from 'antd';
import { getDictList, addDict, deleteDict,updateDict } from '@/services/search';

const utf8 = {
    encode: function (string) {  
        string = string.replace(/\r\n/g,"\n");  
        var utftext = "";  
        for (var n = 0; n < string.length; n++) {  
            var c = string.charCodeAt(n);  
            if (c < 128) {  
                utftext += String.fromCharCode(c);  
            } else if((c > 127) && (c < 2048)) {  
                utftext += String.fromCharCode((c >> 6) | 192);  
                utftext += String.fromCharCode((c & 63) | 128);  
            } else {  
                utftext += String.fromCharCode((c >> 12) | 224);  
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);  
                utftext += String.fromCharCode((c & 63) | 128);  
            }  
   
        }  
        return utftext;  
    } ,
    decode: function (utftext) {  
        var string = "";  
        var i = 0; 
        var c1, c2,c3; 
        var c = c1 = c2 = 0;  
        while ( i < utftext.length ) {  
            c = utftext.charCodeAt(i);  
            if (c < 128) {  
                string += String.fromCharCode(c);  
                i++;  
            } else if((c > 191) && (c < 224)) {  
                c2 = utftext.charCodeAt(i+1);  
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));  
                i += 2;  
            } else {  
                c2 = utftext.charCodeAt(i+1);  
                c3 = utftext.charCodeAt(i+2);  
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));  
                i += 3;  
            }  
        }  
        return string;  
    }  
}

export default {
  namespace: 'dict',

  state: {
    updateFormValues: null,
    currentFormOp: null,
    formTitle: '',
    search: {
      size: 6,
      name: "",
      tags: "",
      pageIndex: 1,
    }
  },
  effects: {
    *fetchDictList({payload}, {call, put}){
        const resp = yield call(getDictList, payload);
        if(resp.errno != "0" || !resp.data.Result){
            return
        }
        resp.data.Result = resp.data.Result.map((item)=>{
            item.content = utf8.decode(atob(item.content))
            return item;
        })
        let search = {name:'', tags: ''};
        payload.pageIndex = payload.from / payload.size + 1;
        search = Object.assign(search, payload);
        
        yield put({
            type: 'saveData',
            payload: {
                dictList: resp.data.Result,
                total: resp.data.Total,
                search: search,
            },
        });
        //message.loading('数据加载完成', 'initdata');
    },
    *addDictItem({payload}, {call, put}){
        let upVals = {
            ...payload,
        }
        upVals.content = btoa(utf8.encode(upVals.content));
        const rel = yield call(addDict, upVals);
        if(rel.errno != "0"){
            message.warn('添加失败：'+ rel.errmsg)
            return
        }
        rel.payload.content = utf8.decode(atob(rel.payload.content));
        yield put({
            type: 'addDict',
            payload: {
                dictItem: rel.payload,
                extra: {
                    updateFormValues: null,
                    currentFormOp: null
                }
            }
        })
    },
    *updateDictItem({payload}, {call, put}){
        let rawContent  = payload.content;
        payload.content = btoa(utf8.encode(payload.content));
        const rel = yield call(updateDict, payload);
        if(rel.errno != "0"){
            message.warn('修改：'+ rel.errmsg)
            return
        }
        payload.content = rawContent;
        yield put({
            type: 'updateDict',
            payload: {
                dictItem: payload,
                extra:{
                    updateFormValues: null,
                    currentFormOp: null
                }
            }
        })
    },
    *deleteDictItem({payload}, {call, put, select}){
        let rel = yield call(deleteDict, payload);
        if(typeof rel !== 'object'){
            rel = JSON.parse(rel);
        }
        if(rel.errno != "0"){
            message.warn('删除失败：'+ rel.errmsg)
            return
        }

        yield put({
            type:'deleteDict',
            payload: {
                dictItem: payload,
            }
        });
        //const search = yield select(state => state.dict.search)
        
        // yield put({
        //     type: 'fetchDictList',
        //     payload: search,
        // })
       //yield take('fetchDictList/@@end')
    }
  },
  reducers: {
    saveData(state, {payload}){
        return {
            ...state,
            ...payload
        };
    },
    addDict(state, {payload}){
        let dictList = state.dictList || [];
        dictList.unshift(payload.dictItem);
        state.dictList = dictList;
        return {
            ...state,
            ...payload.extra,
            total: state.total + 1,
        };
    },
    updateDict(state, {payload}){
        let cdata = state.dictList;
        let idx = cdata.findIndex((item)=>{
          return item.id == payload.dictItem.id;
        })
        idx > -1 && (cdata[idx] = payload.dictItem);
        return {
            ...state,
            ...payload.extra,
        }
    },
    deleteDict(state, {payload}){
        let cdata = state.dictList;
        let idx = cdata.findIndex((item)=>{
          return item.id == payload.dictItem.id;
        })
        idx > -1 && (state.dictList.splice(idx, 1));
        return {
            ...state,
            total: state.total - 1,
        }
    }
  },
};
