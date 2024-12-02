import request from '@/utils/request';
import {pathPrefix, ESPrefix} from './common';

export async function getDocList(params) {
  params.from = (params.pageIndex - 1) * params.pageSize;
  params.size = params.pageSize;
  delete params.pageSize;
  delete params.pageIndex;
  return request(`${ESPrefix}/${params.clusterID}/doc/${params.index}/_search`, {
    method: 'POST',
    body: params,
  });
}

export async function saveDoc(params) {
  let url =  `${pathPrefix}/doc/${params._index}/${params._id}`;
  if(params._type){
    url += `?_type=${params._type}`;
  }
  return request(url, {
    method: 'PUT',
    body: params.data,
  });
}

export async function deleteDoc(params) {
  let url =`${pathPrefix}/doc/${params._index}/${params._id}`;
  if(params._type){
    url += `?_type=${params._type}`;
  }
  return request(url, {
    method: 'DELETE',
  });
}

export async function addDoc(params) {
  let url = `${pathPrefix}/doc/${params._index}/_create`;
  if(params._type){
    url += `?_type=${params._type}`;
  }
  return request(url, {
    method: 'POST',
    body: params.data,
  });
}
