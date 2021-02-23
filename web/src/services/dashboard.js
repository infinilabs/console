import request from '@/utils/request';
import { func } from 'prop-types';

export async function getClusterOverview(payload){
    return request('/dashboard/cluster/overview',{
        method: 'POST',
        body: payload,
        expirys: 0,
      });
}

export async function getClusterNodeStats(){
    return request('/dashboard/cluster/nodes_stats');
}

export async function getClusterList(){
    return request('/dashboard/cluster/list');
}
