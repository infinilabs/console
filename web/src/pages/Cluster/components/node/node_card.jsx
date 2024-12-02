import React, { useState, useEffect } from "react";
import { Icon, Tooltip } from "antd";
import TinyArea from "@/components/infini/TinyArea";
import { Pie } from "@/components/Charts";
import { formatter } from "@/utils/format";
import { StatusBlockGroup, StatusMask } from "@/components/infini/status_block";
import { HealthStatusView } from "@/components/infini/health_status_view";
import { FieldFilterFacet } from "../field_filter_facet";
import { formatUtcTimeToLocal } from "@/utils/utils";

import "./node_card.scss";

const NodeCard = (props) => {
  const metadata = props.data._source?.metadata || {};
  const summary = props.info?.summary || {};
  const metrics = props.info?.metrics || {};
  const fs_total_in_bytes = summary?.fs?.total?.total_in_bytes || 0;
  const fs_available_in_bytes = summary?.fs?.total?.available_in_bytes || 0;
  const fs_used_in_bytes = fs_total_in_bytes - fs_available_in_bytes;
  const jvm_mem_total_in_bytes = summary?.jvm?.mem?.heap_max_in_bytes || 0;
  const jvm_mem_used_in_bytes = summary?.jvm?.mem?.heap_used_in_bytes || 0;
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

  return (
    <div className="card-item node-item">
      <div
        className={`a-item ${props.isActive ? "active" : ""}`}
        onClick={() => props.handleItemDetail(props.data)}
      >
        <StatusMask
          status={metadata?.labels?.status}
          label={`Node is not available since:${
            props.data._source?.timestamp
              ? formatUtcTimeToLocal(props.data._source?.timestamp)
              : "N/A"
          }`}
        />
        <div className="node-basic">
          <span className="cbl">
            <span className="node-name">
              Cluster:{metadata?.cluster_name ?? "N/A"}
              <FieldFilterFacet
                field="metadata.cluster_name"
                value={metadata?.cluster_name ?? "N/A"}
                onClick={props.onChangeFacet}
              />
            </span>
            <span className="node-name">Node:{metadata?.node_name}</span>
            <span className="node-name">
              Version:{metadata?.labels?.version ?? "N/A"}
              <FieldFilterFacet
                field="metadata.labels.version"
                value={metadata?.labels?.version ?? "N/A"}
                onClick={props.onChangeFacet}
              />
            </span>
          </span>
          <span className="cbm">
            <span style={{ display: "flex", gap: 5 }}>
              <span>Status:</span>
              <HealthStatusView status={metadata?.labels?.status} />
              <FieldFilterFacet
                field="metadata.labels.status"
                value={metadata?.labels?.status ?? "N/A"}
                onClick={props.onChangeFacet}
                style={{ paddingLeft: 0 }}
              />
            </span>
          </span>
          {metadata?.owner ? (
            <span className="cbr">
              <Icon type="team" />
              <span className="node-owner-department">
                {metadata?.owner?.[0]?.department}
              </span>
              <span>-</span>
              <span className="node-owner-name">
                {metadata?.owner?.[0]?.name}
              </span>
            </span>
          ) : (
            ""
          )}
        </div>
        <div className="node-info">
          <div className="info-left">
            <div className="info-meta">
              <span className="meta-general-label">
                Transport Address:
                <span className="meta-label-text">
                  {metadata?.labels?.transport_address}
                </span>
              </span>

              <span className="meta-general-label">
                Roles:
                <Tooltip title={metadata?.labels?.roles?.join(",")}>
                  <span className="meta-label-text">
                    {metadata?.labels?.roles?.join(",")}
                  </span>
                </Tooltip>
              </span>
            </div>

            <div className="info-status">
              <div className="info-status-label">
                {metrics?.status?.metric?.label +
                  " " +
                  (metrics.status?.data?.length || "N/A") +
                  " " +
                  metrics?.status?.metric?.units}
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

export default NodeCard;
