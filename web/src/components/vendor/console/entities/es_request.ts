export interface ESRequest {
  method: string;
  endpoint: string;
  data?: string;
}

export interface ESRequestParams {
  method: string,
  path: string,
  body?: string,
}

export type BaseResponseType =
  | 'application/json'
  | 'text/csv'
  | 'text/tab-separated-values'
  | 'text/plain'
  | 'application/yaml'
  | 'unknown';

export interface EsRequestArgs {
  requests: Array<{ url: string; method: string; data: string[], rawRequest?: string }>;
  clusterID: string;
}

export interface ESResponseObject<V = unknown> {
  statusCode: number;
  statusText: string;
  timeMs: number;
  contentType: BaseResponseType;
  value: V;
}

export interface ESRequestResult<V = unknown> {
  request: { data: string; method: string; path: string };
  response: ESResponseObject<V>;
}
