import {getClusterOverview, getClusterNodeStats, getClusterList} from "@/services/dashboard";

export default {
    namespace: 'clusterMonitor',
    state: {

    },
    effects:{
        *fetchClusterOverview({payload, callback}, {call, put}){
            let clusterData = yield call(getClusterOverview, payload);
            yield put({type: 'saveData', payload: clusterData})
            if(callback && typeof callback == 'function'){
                callback(clusterData);
            }
        },
        *fetchClusterNodeStats({callback}, {call, put}){
            let nodesStats = yield call(getClusterNodeStats);
            //yield put({type: 'saveData', payload: nodesStats})
            if(callback && typeof callback == 'function'){
                callback(nodesStats);
            }
        },
        *fetchClusterList({callback}, {call, put}){
            let clusterData = yield call(getClusterList);
            yield put({type: 'saveData', payload: {
                clusterList: clusterData
            }})
            if(callback && typeof callback == 'function'){
                callback(clusterData);
            }
        }
    },
    reducers:{
        saveData(state, {payload}){
            return {
                ...state,
                ...payload
            };
        },
    }
};