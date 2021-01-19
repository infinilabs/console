import request from '@/utils/request';
import {pathPrefix} from './common';

export async function getMappings(payload){
  let index = payload.index || '*'
  let url = `${pathPrefix}/index/${index}/_mappings`;
  return request(url,{
      method: 'GET',
      expirys: 0,
    });
}

export async function getSettings(payload){
    let index = payload.index || '*'
    let url = `${pathPrefix}/index/${index}/_settings`;
    return request(url,{
        method: 'GET',
        expirys: 0,
    });
}

export async function updateSettings(payload){
    let index = payload.index
    let url = `${pathPrefix}/index/${index}/_settings`;
    return request(url,{
        method: 'PUT',
        body: payload.settings,
        expirys: 0,
    });
}

export async function getIndices(params) {
  return request(`${pathPrefix}/_cat/indices`, {
    method: 'GET'
  });
}

export async function deleteIndex(params) {
    let index = params.index;
    return request(`${pathPrefix}/index/${index}`, {
        method: 'DELETE'
    });
}