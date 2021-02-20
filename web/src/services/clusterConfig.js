import {pathPrefix, buildQueryArgs} from "./common";
import request from '@/utils/request';

export async function createClusterConfig(params) {
  return request(`${pathPrefix}/system/cluster`, {
    method: 'POST',
    body: params,
  });
}

export async function updateClusterConfig(params) {
  let id = params.id;
  delete(params['id']);
  return request(`${pathPrefix}/system/cluster/${id}`, {
    method: 'PUT',
    body: params,
  });
}

export async function deleteClusterConfig(params) {
  return request(`${pathPrefix}/system/cluster/${params.id}`, {
    method: 'DELETE',
    body: params,
  });
}

export async function searchClusterConfig(params) {
  let url = `${pathPrefix}/system/cluster/_search`;
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
