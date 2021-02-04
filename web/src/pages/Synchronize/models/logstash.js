import { routerRedux } from 'dva/router';
import { message } from 'antd';
import { getLogstashConfig, saveLogstashConfig } from '@/services/datamanagement';

export default {
  namespace: 'logstash',

  state: {
      logstash: {
          jdbc:{},
          kafka:{},
      }
  },
  effects: {
    *queryInitialLogstashConfig(_, {call, put}){
        const istate = yield call(getLogstashConfig);
        yield put({
            type: 'initLogstashState',
            payload: istate,
        });
        message.loading('数据加载完成', 'initdata');
    },
    *submitLogstashConfig({payload}, {call, put}){
        console.log(payload);
        const rel = yield call(saveLogstashConfig, payload);
        if(rel.message == "Ok") {
            message.success('提交成功');
            yield put({
                type: 'updateState',
                payload: payload,
            });
        }
    }
  },
  reducers: {
    initLogstashState(state, { payload: istate }) {
        return {
            logstash: istate
        }
    },
    updateState(state, {payload: newState}){
      var obj = {
          ...state,
          logstash: Object.assign(state.logstash, newState),
      };
      return obj;
    },
  },
};
