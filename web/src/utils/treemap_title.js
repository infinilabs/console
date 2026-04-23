import { formatMessage } from "umi/locale";

const TREEMAP_TITLE_MAP = {
  "Search latency by index": "cluster.monitor.treemap.search_latency_by_index",
  "Avg search latency by index":
    "cluster.monitor.treemap.search_latency_by_index",
};

export const getLocalizedTreemapTitle = (title) => {
  if (!title) {
    return title;
  }

  const localeId = TREEMAP_TITLE_MAP[title];
  if (!localeId) {
    return title;
  }

  return formatMessage({
    id: localeId,
    defaultMessage: title,
  });
};
