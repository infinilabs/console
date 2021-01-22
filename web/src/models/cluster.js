import { getClusterVersion } from '@/services/cluster';

export default {
    namespace: 'cluster',
    state: {
    },

    effects: {
        *fetchClusterVersion({ payload }, { call, put }) {
            let res = yield call(getClusterVersion, payload);
            yield put({
                type: 'saveData',
                payload: res.payload
            })
        }
    },

    reducers: {
        saveData(state, {payload}){
            return {
                ...state,
                ...payload,
            }
        }
    },
};
