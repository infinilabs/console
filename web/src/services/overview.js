import request from '@/utils/request';
import {ESPrefix} from './common';

export async function getOverview(params) {
    return request(`${ESPrefix}/overview`, {
        method: 'GET'
    });
}
