import { message } from 'antd';
import { getPipelines, addPipeline, updatePipeline,deletePipeline } from '@/services/datamanagement';

export default {
  namespace: 'pipeline',

  state: {
      datalist: {
          list:[],
          pagination:{
              pageSize: 5,
          }
      },
  },
  effects: {
    *fetch({payload}, {call, put}){
        let idata = yield call(getPipelines);
        yield put({
            type:"initdata",
            payload: idata,
        });
    },
    *add({payload}, {call, put}){
        const res = yield call(addPipeline, payload);
        if(res.message == "Ok") {
            yield put({
                type: 'addNew',
                payload: payload,
            });
        }
    },
    *update({payload,callback}, {call, put}){
        const res = yield call(updatePipeline, payload);
        if(res.message == "Ok") {
            yield put({
                type: 'updateData',
                payload: payload,
            });
        }
        if(callback && typeof callback === "function"){
            callback(res);
        }
    },
    *delete({payload, callback}, {call, put}){
        const res = yield call(deletePipeline, payload);
        console.log(res);
        if(res.message == "Ok") {
            yield put({
                type: 'deleteData',
                payload: payload,
            });
        }
        if(callback && typeof callback === "function"){
            callback(res);
        }
    },
  },
  reducers: {
      initdata(state, {payload: newdata}){
        return {
              ...state,
              datalist: {
                ...state.datalist,
                list: newdata,
              },
        };
      },
      addNew(state, {payload: newdata}){
        state.datalist.list.push(newdata);
        return state;
      },
      updateData(state, {payload: newdata}){
            let targetIdx = -1;
            state.datalist.list.forEach((p,i) => {
                if(p.name == newdata.name){
                    targetIdx = i;
                }
            });
            targetIdx > -1 && (state.datalist.list[targetIdx] = newdata);
            return state;
      },
      deleteData(state, {payload: newdata}){
        let pipelineList = state.datalist.list;
        var keys = newdata.key || [];
        var hasDeleted = false;
        for(let i=0; i< keys.length; i++){
          let targetIdx = -1;
          pipelineList.forEach(function(p, j){
              if(keys[i] == p.name){
                  targetIdx = j;
              }
          });
          if(targetIdx > -1) {
              pipelineList.splice(targetIdx, 1);
              hasDeleted = true;
          }
        }
        return state;
    },
  },
};
