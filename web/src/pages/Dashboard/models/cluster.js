import {getClusterOverview, getClusterNodeStats} from "@/services/dashboard";

export default {
    namespace: 'clusterMonitor',
    state: {

    },
    effects:{
        *fetchClusterOverview({callback}, {call, put}){
            let clusterData = yield call(getClusterOverview);
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