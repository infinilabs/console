import ElasticImg from "@/assets/elasticsearch.svg";
import EasysearchImg from "@/assets/easysearch.svg";
import OpenSearchImg from "@/assets/opensearch.svg";
import { useMemo } from "react";
import { Icon } from "antd";
import { generateIcon } from "./providers";

export const SearchEngines = {
  Elasticsearch: "elasticsearch",
  Opensearch: "opensearch",
  Easysearch: "easysearch",
};

export const SearchEngineIcon = ({
  distribution,
  width = "24px",
  height = "24px",
}) => {
  const [elasticsearchIcon, easysearchIcon, opensearchIcon] = useMemo(() => {
    return [
      generateIcon(width, height, ElasticImg),
      generateIcon(width, height, EasysearchImg),
      generateIcon(width, height, OpenSearchImg),
    ];
  }, [width, height]);
  switch (distribution) {
    case SearchEngines.Easysearch:
      return (
        <Icon
          component={easysearchIcon}
          style={{ width: width, height: height }}
        />
      );
    case SearchEngines.Opensearch:
      return (
        <Icon
          component={opensearchIcon}
          style={{ width: width, height: height }}
        />
      );
    default:
      return (
        <Icon
          component={elasticsearchIcon}
          style={{ width: width, height: height }}
        />
      );
  }
};
