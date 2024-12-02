import React, { useState, useEffect } from "react";
import { Icon, Tooltip } from "antd";
import TinyArea from "@/components/infini/TinyArea";
import { Pie } from "@/components/Charts";
import { formatter } from "@/utils/format";
import { StatusBlockGroup, StatusMask } from "@/components/infini/status_block";
import { FieldFilterFacet } from "./field_filter_facet";
import { formatUtcTimeToLocal } from "@/utils/utils";

import "./cluster_card.scss";

const ClusterCard = (props) => {
  const clusterID = props.data?._id;
  const metadata = props.data._source || {};
  const summary = props.info.summary || {};
  const metrics = props.info.metrics || {};
  const fs_total_in_bytes = summary?.fs?.total_in_bytes || 0;
  const fs_available_in_bytes = summary?.fs?.available_in_bytes || 0;
  const fs_used_in_bytes = fs_total_in_bytes - fs_available_in_bytes;
  const jvm_mem_total_in_bytes = summary?.jvm?.heap_max_in_bytes || 0;
  const jvm_mem_used_in_bytes = summary?.jvm?.heap_used_in_bytes || 0;
  const diskPercent = Math.round((fs_used_in_bytes / fs_total_in_bytes) * 100);
  const jvmMemPercent = Math.round(
    (jvm_mem_used_in_bytes / jvm_mem_total_in_bytes) * 100
  );
  let locationInfo = "";
  for (let k in metadata?.location) {
    locationInfo += metadata?.location?.[k] + "-";
  }
  locationInfo = locationInfo.substring(0, locationInfo.lastIndexOf("-"));

  let metricsSearch = metrics?.search || {};
  let metricsSearchData = metricsSearch?.data || [];
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
  let metricsIndexingData = metricsIndexing?.data || [];
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
    <div
      className={`card-item cluster-item border-${healthStatus ||
        "unavailable"}`}
    >
      <div
        className={`a-item ${props.isActive ? "active" : ""}`}
        onClick={() => props.handleItemDetail(props.data)}
      >
        <StatusMask
          status={healthStatus}
          label={`Cluster is not available since:${
            metadata?.updated ? formatUtcTimeToLocal(metadata?.updated) : "N/A"
          }`}
        />
        <div className={`cluster-basic bg-${healthStatus || "unavailable"}`}>
          <span className="cbl">
            <Tooltip
              title={
                <span>
                  {/* Project: {metadata?.project?.name ?? "N/A"}
                  <br /> */}
                  Cluster ID: {clusterID ?? "N/A"}
                  <br />
                  Cluster Name: {metadata?.name ?? "N/A"}{" "}
                  {metadata?.description ? (
                    <span>
                      <br />
                      Description: {metadata?.description}
                    </span>
                  ) : (
                    ""
                  )}
                </span>
              }
            >
              <span className="cluster-name">Cluster: {metadata?.name}</span>
            </Tooltip>
            <span className="cluster-version">
              Version:{metadata?.version ?? "N/A"}
              <FieldFilterFacet
                field="version"
                value={metadata?.version ?? "N/A"}
                onClick={props.onChangeFacet}
              />
            </span>
          </span>

          {metadata?.location ? (
            <span className="cbm">
              <Icon type="environment" />
              <span className="cluster-location-provider">
                {metadata?.location?.provider ?? "N/A"}
              </span>
              <span>-</span>
              <span className="cluster-location-region">
                {metadata?.location?.region ?? "N/A"}
              </span>
              <Tooltip title={locationInfo}>
                <Icon type="info-circle-o" />
              </Tooltip>
            </span>
          ) : (
            ""
          )}

          {metadata?.owner ? (
            <span className="cbr">
              <Icon type="team" />
              <span className="cluster-owner-department">
                {metadata?.owner?.[0]?.department ?? "N/A"}
              </span>
              <span>-</span>
              <span className="cluster-owner-name">
                {metadata?.owner?.[0]?.name ?? "N/A"}
              </span>
            </span>
          ) : (
            ""
          )}
        </div>
        <div className="cluster-info">
          <div className="info-left">
            <div className="info-meta">
              <span className="meta-label">
                <span className="meta-label-text">Nodes:</span>
                <span className="meta-label-value">
                  {summary?.number_of_nodes || 0}
                </span>
              </span>
              <span className="meta-label">
                <span className="meta-label-text">Indices:</span>
                <span className="meta-label-value">
                  {summary?.number_of_indices || 0}
                </span>
              </span>
              <span className="meta-label">
                <span className="meta-label-text">Shards:</span>
                <span className="meta-label-value">
                  {summary.number_of_shards || 0}
                </span>
              </span>
              <span className="meta-label">
                <Tooltip
                  title={`Docs:${formatter.number(
                    summary?.number_of_documents
                  )}`}
                >
                  <span className="meta-label-text">Docs:</span>
                  <span className="meta-label-value">
                    {formatter.numberToHuman(summary?.number_of_documents)}
                  </span>
                </Tooltip>
              </span>
              <span className="meta-label">
                <span className="meta-label-text">Disk Usage:</span>
                <span className="meta-label-value">
                  {formatter.bytes(fs_used_in_bytes)}
                </span>
              </span>
              <span className="meta-label">
                <span className="meta-label-text">Mem Used:</span>
                <span className="meta-label-value">
                  {formatter.bytes(jvm_mem_used_in_bytes)}
                </span>
              </span>
            </div>
            <div className="info-status">
              <div className="info-status-label">
                {metrics?.status?.metric?.label +
                  "(" +
                  (metrics.status?.data?.length || "N/A") +
                  " " +
                  metrics.status?.metric?.units +
                  ")"}
              </div>
              <StatusBlockGroup data={metrics?.status?.data} />
            </div>
          </div>
          <div className="info-right">
            <div className="info-chart">
              <div className="pie-chart">
                <div className="pie-item">
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
                      color={"rgb(24, 144, 255)"}
                      inner={0.6}
                      tooltip={false}
                      margin={[0, 0, 0, 0]}
                      percent={diskPercent}
                      height={80}
                      total={diskPercent.toString() + "%"}
                    />
                    <div className="pie-label">Disk Usage</div>
                  </Tooltip>
                </div>
                <div className="pie-item">
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
                      color={"#a9b108"}
                      inner={0.6}
                      tooltip={false}
                      margin={[0, 0, 0, 0]}
                      percent={jvmMemPercent}
                      height={80}
                      total={jvmMemPercent.toString() + "%"}
                    />
                    <div className="pie-label">JVM Heap</div>
                  </Tooltip>
                </div>
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
      </div>
    </div>
  );
};

export default ClusterCard;
