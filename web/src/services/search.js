import request from '@/utils/request';

export async function getDictList(payload){
    let url = `/api/dict/_search?from=${payload.from}&size=${payload.size}`;
    payload.name && (url+= `&name=${payload.name}`);
    payload.tags && (url+=`&tags=${payload.tags}`);
    return request(url,{
        method: 'GET',
       // body: payload,
        expirys: 0,
      });
}

export async function addDict(payload){
  return request('/api/dict/_create',{
      method: 'POST',
      body: payload,
      expirys: 0,
    });
}

export async function deleteDict(payload){
  return request(`/api/dict/${payload.id}`,{
      method: 'DELETE',
      expirys: 0,
    });
}

export async function updateDict(payload){
  return request('/api/dict/_update',{
      method: 'POST',
      body: payload,
      expirys: 0,
    });
}