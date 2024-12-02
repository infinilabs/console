import request from '@/utils/request';
import {ESPrefix} from './common';

export async function getAliasList(params){
  let url = `${ESPrefix}/${params.clusterID}/alias`;
  return request(url,{
    method: 'GET',
  });
}

export async function doAlias(params){
  let url = `${ESPrefix}/${params.clusterID}/alias`;
  return request(url,{
    method: 'POST',
    body: params.data,
  });
}