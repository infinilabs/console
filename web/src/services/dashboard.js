import request from '@/utils/request';

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