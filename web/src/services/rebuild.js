import request from '@/utils/request';
import {pathPrefix} from './common';

export async function reindex(payload){
    let url = `${pathPrefix}/rebuild/_create`;
    return request(url,{
        method: 'POST',
        body: payload,
        expirys: 0,
      });
}

export async function deleteRebuild(payload){
  let url = `${pathPrefix}/rebuild/_delete`;
  return request(url,{
      method: 'POST',
      body: payload,
      expirys: 0,
    });
}


export async function getRebuildList(payload){
  let url = `${pathPrefix}/rebuild/list?`;
  payload.from && (url+=`from=${payload.from}`)
  payload.size && (url+=`&size=${payload.size}`)
  payload.name && (url+=`&name=${payload.name}`)
  return request(url,{
      method: 'GET',
      expirys: 0,
    });
}