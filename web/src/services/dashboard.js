import request from '@/utils/request';

export async function getClusterOverview(){
    return request('/dashboard/cluster/overview');
}

export async function getClusterNodeStats(){
    return request('/dashboard/cluster/nodes_stats');
}