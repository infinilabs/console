import request from '@/utils/request';
import {pathPrefix} from './common';

export async function getDocList(params) {
  return request(`${pathPrefix}/doc/${params.index}/_search`, {
    method: 'POST',
    body: {
      action: 'SEARCH',
      ...params,
    },
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
  return request(`${pathPrefix}/doc/${params.index}/${id}`, {
    method: 'POST',
    body: params.data,
  });
}
