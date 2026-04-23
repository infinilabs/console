import WidgetLoader from "@/pages/DataManagement/View/WidgetLoader";
import "./index.scss";
import { formatMessage } from "umi/locale";

export default ({sourceCluster={}, targetCluster={}, range={}})=>{

  return <div>
    <div className="perf-title">{formatMessage({id:"migration.title.metrics"})}</div>
    <div className="mi-metrics">
    <div className="metric-item">
      <div className="title">{formatMessage({id:"migration.title.metrics.source_search_qps"})}</div>
      <div className="body">
        <WidgetLoader 
          id="cji1sc28go5i051pl1i1"
          range={range}
          queryParams={{"metadata.labels.cluster_id": sourceCluster.id}}
        />
      </div>
    </div>
    <div className="metric-item">
      <div className="title">{formatMessage({id:"migration.title.metrics.source_search_latency"})}</div>
      <div className="body">
        <WidgetLoader 
          id="cji1sc28go5i051pl1i2"
          range={range}
          queryParams={{"metadata.labels.cluster_id": sourceCluster.id}}
        />
      </div>
    </div>
    <div className="metric-item">
      <div className="title">{formatMessage({id:"migration.title.metrics.target_index_qps"})}</div>
      <div className="body">
        <WidgetLoader 
          id="cji1sc28go5i051pl1i3"
          range={range}
          queryParams={{"metadata.labels.cluster_id": targetCluster.id}}
        />
      </div>
    </div>
    <div className="metric-item">
      <div className="title">{formatMessage({id:"migration.title.metrics.target_index_latency"})}</div>
      <div className="body">
        <WidgetLoader 
          id="cji1sc28go5i051pl1i4"
          range={range}
          queryParams={{"metadata.labels.cluster_id": targetCluster.id}}
        />
      </div>
    </div>
  </div>
  </div>
}