import request from "@/utils/request";
import { buildQueryArgs, pathPrefix } from "./common";

export async function searchCommand(params) {
  let url = `${pathPrefix}/elasticsearch/command`;
  let args = buildQueryArgs({
    keyword: params.keyword,
    from: params.from,
    size: params.size,
  });
  if (args.length > 0) {
    url += args;
  }
  return request(url, {
    method: "GET",
  });
}

export async function deleteCommand(params) {
  const url = `${pathPrefix}/elasticsearch/command/${params.id}`;
  return request(url, {
    method: "DELETE",
  });
}

export async function saveCommand(params) {
  const url = `${pathPrefix}/elasticsearch/command/${params.id}`;
  return request(url, {
    method: "PUT",
    body: params,
  });
}
