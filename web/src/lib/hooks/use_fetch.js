import useAsync from "./use_async";
import request from "@/utils/request";

const DEFAULT_OPTIONS = {
  headers: { "Content-Type": "application/json" },
};

export default function useFetch(url, options = {}, dependencies = [], runInInit = true) {
  const { returnRawResponse, noticeable, ...rest } = options || {}
  return useAsync(() => {
    return request(url, { ...DEFAULT_OPTIONS, ...rest }, returnRawResponse, noticeable);
  }, dependencies, runInInit);
}
