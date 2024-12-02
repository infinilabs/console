import useAsync from "./use_async";
import request from "@/utils/request";

const DEFAULT_OPTIONS = {
  headers: { "Content-Type": "application/json" },
};

export default function useFetch(url, options = {}, dependencies = []) {
  return useAsync(() => {
    return request(url, { ...DEFAULT_OPTIONS, ...options });
  }, dependencies);
}
