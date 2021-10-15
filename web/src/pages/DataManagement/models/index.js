import { getIndices,getMappings, getSettings, deleteIndex,
updateSettings,createIndex} from '@/services/indices';
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
            let resp = yield call(getIndices, payload)
            if(resp.error){
                message.error("获取数据失败")
                return
            }
            yield put({
                type: 'saveData',
                payload: {
                    clusterIndices: resp,
                  //  cluster: payload.cluster,
                }
            })
        },
        *fetchMappings({payload}, {call, put}){
            let resp = yield call(getMappings, payload);
            if(resp.error){
                message.warn(resp.error)
                return
            }
            yield put({
                type: 'saveData',
                payload: {
                    mappings: resp,
                }
            })
        },
        *fetchSettings({payload}, {call, put}){
            let resp = yield call(getSettings, payload);
            if(resp.error){
                message.warn(resp.error)
                return
            }
            yield put({
                type: 'saveData',
                payload: {
                    settings: resp,
                }
            })
        },
        *saveSettings({payload}, {call, put, select}){
            let resp = yield call(updateSettings, payload);
            if(resp.error){
                message.error(resp.error)
                return
            }
            if(resp.result == 'updated'){
                message.success("save successfully")
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
            if(resp.error){
                message.error(resp.error)
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
        },
        *addIndex({payload}, {call, put, select}){
            let resp = yield call(createIndex, payload);
            if(resp.error){
                message.error(resp.error)
                return
            }
            yield put({
                type: 'fetchIndices',
                payload: {
                    clusterID: payload.clusterID,
                }
            })
        },
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