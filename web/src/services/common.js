export const pathPrefix = '/_search-center';

export function buildQueryArgs(params){
  let argsStr = '';
  for(let key in params){
    if(typeof params[key] !== 'undefined') {
      argsStr += `${key}=${params[key]}&`
    }
  }
  if(argsStr.length > 0){
    argsStr = '?' + argsStr
    argsStr = argsStr.slice(0, argsStr.length -1)
  }
  return argsStr;
}