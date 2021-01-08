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


export async function getIndices(params) {
  return request(`${pathPrefix}/_cat/indices`, {
    method: 'GET'
  });
}