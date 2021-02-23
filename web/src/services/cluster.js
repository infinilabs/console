import request from '@/utils/request';
import {buildQueryArgs, pathPrefix} from './common';

export async function getClusterVersion(params) {
    return request(`${pathPrefix}/cluster/${params.cluster}/version`, {
        method: 'GET'
    });
}

export async function getClusterMetrics(params) {
    let id = params.cluster_id;
    delete(params['cluster_id']);
    return request(`${pathPrefix}/cluster/${id}/metrics`, {
        method: 'GET'
    });
}

export async function createClusterConfig(params) {
    return request(`${pathPrefix}/cluster`, {
        method: 'POST',
        body: params,
    });
}

export async function updateClusterConfig(params) {
    let id = params.id;
    delete(params['id']);
    return request(`${pathPrefix}/cluster/${id}`, {
        method: 'PUT',
        body: params,
    });
}

export async function deleteClusterConfig(params) {
    return request(`${pathPrefix}/cluster/${params.id}`, {
        method: 'DELETE',
        body: params,
    });
}

export async function searchClusterConfig(params) {
    let url = `${pathPrefix}/cluster/_search`;
    let args = buildQueryArgs({
        name: params.name,
        enabled: params.enabled
    });
    if(args.length > 0){
        url += args;
    }
    return request(url, {
        method: 'GET',
    });
}
