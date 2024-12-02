import request from '@/utils/request';

export async function getLogstashConfig(){
    return request('/data/logstash/config');
}

export async function saveLogstashConfig(config){
    return request('/data/logstash/config', {
        method: 'POST',
        body: config,
      });
}

// pipeline
export async function getPipelines(params){
    return request('/data/pipeline');
}

export async function addPipeline(params){
    return request('/data/pipeline/add', {
        method: 'POST',
        body: params,
      });
}

export async function updatePipeline(params){
    return request('/data/pipeline/update', {
        method: 'PUT',
        body: params,
      });
}
export async function deletePipeline(params){
    return request('/data/pipeline', {
        method: 'POST',
        body: params,
    });
}
//end pipeline