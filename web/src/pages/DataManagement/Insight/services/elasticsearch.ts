import request from "@/utils/request";

const route = "/elasticsearch"

export async function getVisualizationMeta(data: {[key: string]: any}){
    const { clusterId, indexPattern: index_pattern, timeField: time_field, filter } = data;
    return request(`${route}/${clusterId}/visualization/metadata`,{
        method: 'POST',
        body: {
            index_pattern, 
            time_field,
            filter
        },
    });
}

export async function getWidgetData(data: {[key: string]: any}){
    const { cluster_id, indexPattern: index_pattern, timeField: time_field, filter, bucketSize: bucket_size, ...rest } = data;
    return request(`${route}/${cluster_id}/visualization/data`,{
        method: 'POST',
        body: {
            index_pattern, 
            time_field,
            filter,
            bucket_size,
            ...rest
        },
    });
}

export async function getDataTips(data: {[key: string]: any}){
    const { clusterId, indexPattern: index_pattern, timeField: time_field, filter } = data;
    return request(`${route}/${clusterId}/visualization/preview`,{
        method: 'POST',
        body: {
            index_pattern, 
            time_field,
            filter,
        },
    });
}