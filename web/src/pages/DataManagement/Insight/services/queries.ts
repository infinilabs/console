import request from "@/utils/request";
import { API_PREFIX } from "../constants/api";

const route = "/dashboard"

export async function create(data: {[key: string]: any}){
    return request(`${API_PREFIX}${route}`,{
        method: 'POST',
        body: data,
    });
}

export async function remove(id: string){
  return request(`${API_PREFIX}${route}/${id}`,{
      method: 'DELETE',
  });
}

export async function update(data: {[key: string]: any}){
  const { id, ...body } = data;
  return request(`${API_PREFIX}${route}/${id}`,{
      method: 'PUT',
      body,
  });
}

export async function list(params: {[key: string]: any}){
  return request(`${API_PREFIX}${route}/_search`,{
      method: 'GET',
      queryParams: params
  });
}