import React, { useState, useEffect } from "react";
import { Icon, Tooltip } from "antd";
import TinyArea from "@/components/infini/TinyArea";
import { Pie } from "@/components/Charts";
import { formatter } from "@/utils/format";
import { StatusBlockGroup, StatusMask } from "@/components/infini/status_block";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { FieldFilterFacet } from "@/components/Overview/List/FieldFilterFacet";
import "./index.scss";
import { Providers, ProviderIcon } from "@/lib/providers";
import { formatMessage } from "umi/locale";
import { SearchEngineIcon } from "@/lib/search_engines";

export default (props) => {
  const clusterID = props.data?._id;
  const metadata = props.data._source || {};
  const summary = props.info.summary || {};
  const metrics = props.info.metrics || {};
  const fs_total_in_bytes = summary?.fs?.total_in_bytes || 0;
  const fs_available_in_bytes = summary?.fs?.available_in_bytes || 0;
  const fs_used_in_bytes = fs_total_in_bytes - fs_available_in_bytes;
  const jvm_mem_total_in_bytes = summary?.jvm?.heap_max_in_bytes || 0;
  const jvm_mem_used_in_bytes = summary?.jvm?.heap_used_in_bytes || 0;
  const disk_percent =
    fs_total_in_bytes > 0
      ? Math.round((fs_used_in_bytes / fs_total_in_bytes) * 100)
      : 0;
  const jvm_mem_percent =
    jvm_mem_total_in_bytes > 0
      ? Math.round((jvm_mem_used_in_bytes / jvm_mem_total_in_bytes) * 100)
      : 0;

  const defaultEmptyMetricsData = () => {
    const defaultLen = 14;
    const items = [];
    for (let i = 0; i < defaultLen; i++) {
      items.push([0, 0]);
    }
    return items;
  };

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

  const healthStatus = metadata.labels?.health_status;

  return (
    <div className="card-wrap">
      <div
        className={`card-item ${props.isActive ? "active" : ""}`}
        onClick={() => props.onSelect()}
      >
        <StatusMask
          status={healthStatus}
          label={`Cluster is not available since:${
            metadata?.updated ? formatUtcTimeToLocal(metadata?.updated) : "N/A"
          }`}
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
                  Host: {metadata?.host}
                  <br />
                  Provider:{" "}
                  {formatMessage({
                    id: `cluster.providers.${metadata?.location?.provider ??
                      Providers.OnPremises}`,
                  })}
                  <br />
                  Region: {metadata?.location?.region ?? ""}
                  <br />
                  Version: {metadata?.version ?? ""}
                  <br />
                  Tags: {metadata?.tags ? metadata.tags.toString() : ""}
                </span>
              }
            >
              <div className="title">
                <SearchEngineIcon
                  distribution={metadata?.distribution}
                  width="20px"
                  height="20px"
                />
                <span className="text">{metadata?.name}</span>
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
                <div className="value">{summary?.number_of_nodes || 0}</div>
                <div className="lable">Nodes</div>
              </div>
              <div className="metric">
                <div className="value">{summary?.number_of_indices || 0}</div>
                <div className="lable">Indices</div>
              </div>
              <div className="metric">
                <div className="value">{summary?.number_of_shards || 0}</div>
                <div className="lable">Shards</div>
              </div>
              <div className="metric">
                <Tooltip
                  title={`Docs:${formatter.number(
                    summary?.number_of_documents
                  )}`}
                >
                  <div className="value">
                    {formatter.numberToHuman(summary?.number_of_documents)}
                  </div>
                </Tooltip>
                <div className="lable">Docs</div>
              </div>
            </div>
          </div>
        </div>
        <div className="card-chart">
          <div className="pie-chart">
            <Tooltip
              title={
                <span>
                  Total:{formatter.bytes(fs_total_in_bytes)}
                  <br />
                  Used:{formatter.bytes(fs_used_in_bytes)}
                  <br />
                  Free:{formatter.bytes(fs_available_in_bytes)}
                </span>
              }
            >
              <Pie
                animate={false}
                color={"#558EF0"}
                inner={0.6}
                tooltip={false}
                margin={[0, 0, 0, 0]}
                percent={disk_percent}
                height={80}
                total={disk_percent.toString() + "%"}
              />
              <div className="pie-label">Disk Usage</div>
            </Tooltip>
          </div>
          <div className="pie-chart">
            <Tooltip
              title={
                <span>
                  Total:{formatter.bytes(jvm_mem_total_in_bytes)}
                  <br />
                  Used:{formatter.bytes(jvm_mem_used_in_bytes)}
                  <br />
                  Free:
                  {formatter.bytes(
                    jvm_mem_total_in_bytes - jvm_mem_used_in_bytes
                  )}
                </span>
              }
            >
              <Pie
                animate={true}
                color={"#00BFB3"}
                inner={0.6}
                tooltip={false}
                margin={[0, 0, 0, 0]}
                percent={jvm_mem_percent}
                height={80}
                total={jvm_mem_percent.toString() + "%"}
              />
              <div className="pie-label">JVM Heap</div>
            </Tooltip>
          </div>
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
  );
};
