import request from '@/utils/request';
import {pathPrefix} from './common';

export async function reindex(payload){
  let id = payload.id || '';
    let url = `${pathPrefix}/rebuild/${id}`;
    return request(url,{
        method: 'POST',
        body: payload,
        expirys: 0,
      });
}

export async function deleteRebuild(payload){
  let id = payload.id;
  let url = `${pathPrefix}/rebuild/${id}`;
  return request(url,{
      method: 'DELETE',
      expirys: 0,
    });
}


export async function getRebuildList(payload){
  let url = `${pathPrefix}/rebuild/_search?`;
  payload.from && (url+=`from=${payload.from}`)
  payload.size && (url+=`&size=${payload.size}`)
  payload.name && (url+=`&name=${payload.name}`)
  return request(url,{
      method: 'GET',
      expirys: 0,
    });
}