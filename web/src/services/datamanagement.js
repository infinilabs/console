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