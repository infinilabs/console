import request from '@/utils/request';

export async function getHealth(){
    return request("/health", {}, undefined, false);
  }