import { SearchEngineIcon, SearchEngines } from "@/lib/search_engines";
import "./index.scss";

export default ({ value, onChange }) => {
  return (
    <div className="searchEngineBox">
      <div
        className={
          value == SearchEngines.Elasticsearch
            ? "searchEngineBoxActive"
            : "searchEngineBoxDisable"
        }
        onClick={() => {
          onChange(SearchEngines.Elasticsearch);
        }}
      >
        <SearchEngineIcon distribution={SearchEngines.Elasticsearch} />
        <span>Elasticsearch</span>
      </div>
      <div
        className={
          value == SearchEngines.Opensearch
            ? "searchEngineBoxActive"
            : "searchEngineBoxDisable"
        }
        onClick={() => {
          onChange(SearchEngines.Opensearch);
        }}
      >
        <SearchEngineIcon distribution={SearchEngines.Opensearch} />
        <span>OpenSearch</span>
      </div>
      <div
        className={
          value == SearchEngines.Easysearch
            ? "searchEngineBoxActive"
            : "searchEngineBoxDisable"
        }
        onClick={() => {
          onChange(SearchEngines.Easysearch);
        }}
      >
        <SearchEngineIcon distribution={SearchEngines.Easysearch} />
        <span>Easysearch</span>
      </div>
    </div>
  );
};
