import request from '@/utils/request';
import {pathPrefix} from './common';

export async function getOverview(params) {
    return request(`${pathPrefix}/elasticsearch/overview`, {
        method: 'GET'
    });
}
