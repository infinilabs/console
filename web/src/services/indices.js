import request from '@/utils/request';
import {pathPrefix} from './common';

export async function getMappings(payload){
  let index = payload.index || '*'
  let url = `${pathPrefix}/indices/_mappings/${index}`;
  return request(url,{
      method: 'GET',
      expirys: 0,
    });
}