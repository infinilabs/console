import request from '@/utils/request';
import {pathPrefix} from './common';

export async function getDocList(params) {
  return request(`${pathPrefix}/doc/${params.index}`, {
    method: 'POST',
    body: {
      action: 'SEARCH',
      ...params,
    },
  });
}

export async function saveDoc(params) {
  return request(`${pathPrefix}/doc/${params.index}`, {
    method: 'POST',
    body: {
      payload: params.data,
      index: params.index,
      action: 'SAVE',
    },
  });
}

export async function deleteDoc(params) {
  return request(`${pathPrefix}/doc/${params.index}`, {
    method: 'POST',
    body: {
      index: params.index,
      action: 'DELETE',
      payload: params.data,
    },
  });
}

export async function addDoc(params) {
  return request(`${pathPrefix}/doc/${params.index}`, {
    method: 'POST',
    body: {
      payload: params.data,
      index: params.index,
      action: 'ADD',
    },
  });
}

export async function getIndices(params) {
  return request(`${pathPrefix}/indices/_cat`, {
    method: 'GET'
  });
}