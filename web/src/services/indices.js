import request from '@/utils/request';
import {pathPrefix, ESPrefix} from './common';

export async function getMappings(params){
  let index = params.index || '*'
  let url = `${ESPrefix}/${params.clusterID}/index/${index}/_mappings`;
  return request(url,{
      method: 'GET',
      expirys: 0,
    });
}

export async function getSettings(params){
    let index = params.index || '*'
    let url = `${ESPrefix}/${params.clusterID}/index/${index}/_settings`;
    return request(url,{
        method: 'GET',
        expirys: 0,
    });
}

export async function updateSettings(params){
    let index = params.index
    let url = `${ESPrefix}/${params.clusterID}/index/${index}/_settings`;
    return request(url,{
        method: 'PUT',
        body: params.settings,
        expirys: 0,
    });
}

export async function getIndices(params) {
  return request(`${ESPrefix}/${params.clusterID}/_cat/indices`, {
    method: 'GET'
  });
}

export async function deleteIndex(params) {
    let index = params.index;
    return request(`${ESPrefix}/${params.clusterID}/index/${index}`, {
        method: 'DELETE'
    });
}


export async function createIndex(params) {
    let index = params.index;
    return request(`${ESPrefix}/${params.clusterID}/index/${index}`, {
        method: 'POST',
        body: params.config
    });
}