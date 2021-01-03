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

export async function getRebuildList(payload){
  let url = `${pathPrefix}/rebuild/list`;
  payload.name && (url+=`name=${payload.name}`)
  payload.from && (url+=`name=${payload.from}`)
  payload.size && (url+=`name=${payload.size}`)
  return request(url,{
      method: 'GET',
      expirys: 0,
    });
}