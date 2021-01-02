import {reindex} from '@/services/rebuild';
import { message } from 'antd';

export default {
  namespace: 'rebuild',
  state: {},
  effects:{
    *addTask({payload}, {call, put}){
      let resp = yield call(reindex, payload);
      console.log(resp);
      if(resp.errno != "0"){
        message.warn("rebuild failed")
        return
      }
    }
  },
  reducers: {

  }
}