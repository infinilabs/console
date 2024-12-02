import request from '@/utils/request';
import {pathPrefix} from './common';

export async function getDictList(payload){
    let url = `${pathPrefix}/dict/_search?from=${payload.from}&size=${payload.size}`;
    payload.name && (url+= `&name=${payload.name}`);
    payload.tags && (url+=`&tags=${payload.tags}`);
    return request(url,{
        method: 'GET',
       // body: payload,
        expirys: 0,
      });
}

export async function addDict(payload){
  let id = payload.id || '';
  return request(`${pathPrefix}/dict/${id}`,{
      method: 'POST',
      body: payload,
      expirys: 0,
    });
}

export async function deleteDict(payload){
  return request(`${pathPrefix}/dict/${payload.id}`,{
      method: 'DELETE',
      expirys: 0,
    });
}

export async function updateDict(payload){
  let id = payload.id || '';
  return request(`${pathPrefix}/dict/${id}`,{
      method: 'PUT',
      body: payload,
      expirys: 0,
    });
}