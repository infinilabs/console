import request from '@/utils/request';
import {pathPrefix} from './common';

export async function getClusterVersion(params) {
    return request(`${pathPrefix}/cluster/${params.cluster}/version`, {
        method: 'GET'
    });
}