import React, { useState, useEffect } from "react";
import { Icon, Spin, Tooltip } from "antd";
import TinyArea from "@/components/infini/TinyArea";
import { Pie } from "@/components/Charts";
import { formatter } from "@/utils/format";
import { StatusBlockGroup, StatusMask } from "@/components/infini/status_block";
import { HealthStatusView } from "@/components/infini/health_status_view";
import moment from "moment";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { FieldFilterFacet } from "@/components/Overview/List/FieldFilterFacet";
import "./index.scss";
import request from "@/utils/request";

export default (props) => {
  const { infoAction, id, parentLoading } = props;
  const metadata = props.data._source?.metadata || {};
  const timestamp = props.data._source?.timestamp
    ? formatUtcTimeToLocal(props.data._source?.timestamp)
    : "N/A";

  const defaultEmptyMetricsData = () => {
    const defaultLen = 14;
    const items = [];
    for (let i = 0; i < defaultLen; i++) {
      items.push([0, 0]);
    }
    return items;
  };

  const [info, setInfo] = useState({});
  const [loading, setLoading] = useState(false)

  const fetchListInfo = async (id) => {
    if (!id) return
    setLoading(true)
    const res = await request(infoAction, {
      method: "POST",
      body: [id],
      ignoreTimeout: true
    }, false, false);
    if (res) {
      setInfo(res[id] || {});
    }
    setLoading(false)
  };

  useEffect(() => {
    if (!parentLoading) {
      fetchListInfo(id)
    }
  }, [id, parentLoading])

  const summary = info?.summary || {};
  const metrics = info?.metrics || {};

  let metricsSearch = metrics?.search || {};
  let metricsSearchData = metricsSearch?.data || defaultEmptyMetricsData();
  let searchLineMaxValue = metricsSearchData?.[0]?.[1] || 0;
  const searchLineData = metricsSearchData?.map((item) => {
    let val = item?.[1];
    if (searchLineMaxValue < val) {
      searchLineMaxValue = val;
    }
    return val != parseInt(val) ? Math.round(val * 100) / 100 : val;
  });
  searchLineMaxValue =
    searchLineMaxValue != parseInt(searchLineMaxValue)
      ? Math.round(searchLineMaxValue * 100) / 100
      : searchLineMaxValue;
  let searchLineMaxLabel =
    searchLineMaxValue +
    " " +
    (metricsSearch?.metric?.label ?? "N/A") +
    "/" +
    (metricsSearch?.metric?.units ?? "N/A");

  let metricsIndexing = metrics?.indexing || {};
  let metricsIndexingData = metricsIndexing?.data || defaultEmptyMetricsData();
  let indexingLineMaxValue = metricsIndexingData?.[0]?.[1] || 0;
  const indexingLineData = metricsIndexingData?.map((item) => {
    let val = item?.[1];
    if (indexingLineMaxValue < val) {
      indexingLineMaxValue = val;
    }
    return val != parseInt(val) ? Math.round(val * 100) / 100 : val;
  });
  indexingLineMaxValue =
    indexingLineMaxValue != parseInt(indexingLineMaxValue)
      ? Math.round(indexingLineMaxValue * 100) / 100
      : indexingLineMaxValue;
  let indexingLineMaxLabel =
    indexingLineMaxValue +
    " " +
    (metricsIndexing?.metric?.label ?? "N/A") +
    "/" +
    (metricsIndexing?.metric?.units ?? "N/A");

  const onClickFilter = (e, field, val) => {
    e.stopPropagation();
    props.onChangeFacet({ field: field, value: [val] });
  };

  const healthStatus = metadata?.labels?.health_status;
  const {number_of_replicas, number_of_shards} = props.data._source.payload?.index_state?.settings?.index || {};
  const numReplicas = parseInt(number_of_replicas);
  const numShards = parseInt(number_of_shards);
  const unassignedShards = (numReplicas+1)*numShards-summary?.shards - summary?.replicas || 0

  return (
    <Spin spinning={!parentLoading && loading}>
    <div className="card-wrap card-index">
      <div
        className={`card-item ${props.isActive ? "active" : ""}`}
        onClick={() => props.onSelect()}
      >
        <StatusMask
          status={healthStatus}
          label={`Index is deleted since:${timestamp}`}
        />
        <div className="card-metadata">
          <div
            className={`card-status bg-${healthStatus || "unavailable"}`}
          ></div>
          <div className="card-metadata-info">
            <Tooltip
              placement="topLeft"
              title={
                <span>
                  Cluster: {metadata?.cluster_name}
                  <br />
                  Aliases: {metadata?.aliases?.join(",")}
                  <br />
                  Timestamp: {timestamp}
                </span>
              }
            >
              <div className="title">
                <Icon type="table" style={{ fontSize: 14 }} />
                <span className="text">{metadata?.index_name}</span>
              </div>
            </Tooltip>

            <div className="info">
              <div className="metric">
                <div className="value">
                  <StatusBlockGroup data={metrics?.status?.data} />
                </div>
                <div className="lable">
                  {metrics?.status?.metric?.label +
                    "(" +
                    (metrics.status?.data?.length || 14) +
                    " " +
                    metrics.status?.metric?.units +
                    ")"}
                </div>
              </div>

              <div className="metric">
                <div className="value">{metadata?.labels?.state ?? "N/A"}</div>
                <div className="lable">Status</div>
              </div>
              <div className="metric">
                <div className="value">
                  { formatter.bytes(summary?.store_in_bytes)|| "N/A"}
                </div>
                <div className="lable">Store Size</div>
              </div>
              <div className="metric">
                <Tooltip
                  title={
                    <span>
                      Unassigned Shards:
                      {unassignedShards}
                      <br />
                      Shards:
                      {summary?.shards || 0}
                      <br />
                      Replicas:
                      {numReplicas || 0}
                    </span>
                  }
                >
                  <div className="value">
                    {unassignedShards} /{" "}
                    {(summary?.shards ||
                      0) + (summary?.replicas || 0)}
                  </div>
                </Tooltip>
                <div className="lable">Shards</div>
              </div>
              <div className="metric">
                <Tooltip
                  title={
                    <span>
                      Deleted:
                      {formatter.number(summary?.docs_deleted || 0)}
                      <br />
                      Total:
                      {formatter.number(summary?.docs_count || 0)}
                    </span>
                  }
                >
                  <div className="value">
                    {formatter.numberToHuman(summary?.docs_deleted)} /{" "}
                    {formatter.numberToHuman(summary?.docs_count)}
                  </div>
                </Tooltip>
                <div className="lable">Docs</div>
              </div>
            </div>
          </div>
        </div>
        <div className="card-chart">
          <div className="line-chart">
            <div className="line-item">
              <div className="line-value">
                <TinyArea data={indexingLineData} />
              </div>
              <div className="line-label">{indexingLineMaxLabel}</div>
            </div>
            <div className="line-item">
              <div className="line-value">
                <TinyArea data={searchLineData} />
              </div>
              <div className="line-label">{searchLineMaxLabel}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Spin>
  );
};
