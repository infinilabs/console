import request from '@/utils/request';


export async function getTemplateList(payload){
    let url = `/elasticsearch/${payload.cluster_id}/search_template?from=${payload.from}&size=${payload.size}`;
    payload.name && (url+= `&name=${payload.name}`);
    return request(url,{
        method: 'GET',
        // body: payload,
        expirys: 0,
    });
}


export async function addTemplate(payload){
    console.log("url:addTemplate",payload);
    return request(`/elasticsearch/${payload.cluster_id}/search_template`,{
        method: 'POST',
        body: payload,
        expirys: 0,
    });
}


export async function updateTemplate(payload){
    console.log("url:updateTemplate",payload);
    return request(`/elasticsearch/${payload.cluster_id}/search_template/${payload.id}`,{
        method: 'PUT',
        body: payload,
        expirys: 0,
    });
}

export async function deleteTemplate(payload){
    console.log("url:deleteTemplate",payload);
    return request(`/elasticsearch/${payload.cluster_id}/search_template/${payload.id}`,{
        method: 'DELETE',
        expirys: 0,
    });
}
