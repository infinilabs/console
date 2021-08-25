import request from '@/utils/request';
//import {pathPrefix} from './common';

export async function getAliasList(params){
  let url = `/elasticsearch/${params.clusterID}/alias`;
  return request(url,{
    method: 'GET',
  });
}

export async function doAlias(params){
  let url = `/elasticsearch/${params.clusterID}/alias`;
  return request(url,{
    method: 'POST',
    body: params.data,
  });
}