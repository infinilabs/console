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
  },
  effects: {
    *fetchDictList({payload, callback}, {call, put}){
        const resp = yield call(getDictList, payload);
        if(resp.errno != "0" || !resp.data.Result){
            return
        }
        resp.data.Result = resp.data.Result.map((item)=>{
            item.content = utf8.decode(atob(item.content))
            return item;
        })
        yield put({
            type: 'saveData',
            payload: {
                dictList: resp.data.Result,
                total: resp.data.Total,
                ...payload,
            },
        });
        if(callback && typeof callback == 'function'){
            callback(resp);
        }
        //message.loading('数据加载完成', 'initdata');
    },
    *addDictItem({payload, callback}, {call, put}){
        const rel = yield call(addDict, payload);
        if(rel.errno != "0"){
            message.warn('添加失败：'+ rel.errmsg)
            return
        }
        rel.payload.content = utf8.decode(atob(rel.payload.content));
        yield put({
            type: 'addDict',
            payload: rel.payload,
        })
        if(callback && typeof callback == 'function'){
            callback(rel);
        }
    },
    *updateDictItem({payload, callback}, {call, put}){
        const rel = yield call(updateDict, payload);
        if(rel.errno != "0"){
            message.warn('修改：'+ rel.errmsg)
            return
        }
        yield put({
            type: 'updateDict',
            payload: payload,
        })
        if(callback && typeof callback == 'function'){
            callback(rel);
        }
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
        const state = yield select(state => state.dict)
        yield put({
            type: 'fetchDictList',
            payload: {
                from: state.from,
                size: state.size,
            }
        })
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
        dictList.unshift(payload);
        state.dictList = dictList;
        return state;
    },
    updateDict(state, {payload}){
        let cdata = state.dictList;
        let idx = cdata.findIndex((item)=>{
          return item.id == payload.id;
        })
        idx > -1 && (cdata[idx] = values);
        return state;
    }
  },
};
