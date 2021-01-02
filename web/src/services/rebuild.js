import request from '@/utils/request';
import {pathPrefix} from './common';

export async function reindex(payload){
    let url = `${pathPrefix}/rebuild/_create`;
    return request(url,{
        method: 'POST',
        body: payload,
        expirys: 0,
      });
}