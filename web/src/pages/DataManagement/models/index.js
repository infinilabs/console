import { getIndices,getMappings, getSettings, deleteIndex,
updateSettings} from '@/services/indices';
import { message } from 'antd';

export default {
    namespace: 'index',
    state: {
        clusterIndices: [],
        mappings: {},
        settings: {}
    },
    effects:{
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
        },
        *fetchSettings({payload}, {call, put}){
            let resp = yield call(getSettings, payload);
            if(resp.status === false){
                message.warn("get settings failed")
                return
            }
            yield put({
                type: 'saveData',
                payload: {
                    settings: resp.payload,
                }
            })
        },
        *saveSettings({payload}, {call, put, select}){
            let resp = yield call(updateSettings, payload);
            if(resp.status === false){
                message.warn("save settings failed")
                return
            }
            let {settings} = yield select(state=>state.index);
            settings[payload.index] = payload.settings;
            yield put({
                type: 'saveData',
                payload: {
                    settings
                }
            })
        },
        *removeIndex({payload}, {call, put, select}){
            let resp = yield call(deleteIndex, payload);
            if(resp.status === false){
                message.warn("get mappings failed")
                return
            }
            let {clusterIndices} = yield  select(state=>state.index);
            delete clusterIndices[payload.index];
            yield  put({
                type: 'saveData',
                payload: {
                    clusterIndices: clusterIndices,
                }
            })
        }
    },
    reducers:{
        saveData(state, {payload}){
            return {
                ...state,
                ...payload,
            }
        }
    }
}