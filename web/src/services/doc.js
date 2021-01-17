import request from '@/utils/request';
import {pathPrefix} from './common';

export async function getDocList(params) {
  params.from = (params.pageIndex - 1) * params.pageSize;
  params.size = params.pageSize;
  delete params.pageSize;
  delete params.pageIndex;
  return request(`${pathPrefix}/doc/${params.index}/_search`, {
    method: 'POST',
    body: params,
  });
}

export async function saveDoc(params) {
  return request(`${pathPrefix}/doc/${params.index}/${params.data.id}`, {
    method: 'PUT',
    body: params.data,
  });
}

export async function deleteDoc(params) {
  return request(`${pathPrefix}/doc/${params.index}/${params.data.id}`, {
    method: 'DELETE',
  });
}

export async function addDoc(params) {
  let id = params.data.id || '';
  delete(params.data, 'id');
  return request(`${pathPrefix}/doc/${params.index}/_create`, {
    method: 'POST',
    body: params.data,
  });
}
