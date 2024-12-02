import React, { useState, useEffect } from "react";
import { Icon, Tooltip } from "antd";
import TinyArea from "@/components/infini/TinyArea";
import { Pie } from "@/components/Charts";
import { formatter } from "@/utils/format";
import { StatusBlockGroup, StatusMask } from "@/components/infini/status_block";
import { HealthStatusView } from "@/components/infini/health_status_view";
import { FieldFilterFacet } from "../field_filter_facet";
import moment from "moment";
import { formatUtcTimeToLocal } from "@/utils/utils";

import "./index_card.scss";

const IndexCard = (props) => {
  const indexID = props.data._source?.id;
  const metadata = props.data._source?.metadata || {};
  const summary = props.info?.summary || {};
  const metrics = props.info?.metrics || {};
  const timestamp = props.data._source?.timestamp
    ? formatUtcTimeToLocal(props.data._source?.timestamp)
    : "N/A";

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

  const onClickFilter = (e, field, val) => {
    e.stopPropagation();
    props.onChangeFacet({ field: field, value: [val] });
  };

  return (
    <div className="card-item index-item">
      <div
        className={`a-item ${props.isActive ? "active" : ""}`}
        onClick={() => props.handleItemDetail(props.data)}
      >
        <StatusMask
          status={metadata?.labels?.health_status}
          label={`Index is deleted since:${timestamp}`}
        />
        <div className="index-basic">
          <span className="cbl">
            <span className="index-name">
              Cluster:{metadata?.cluster_name ?? "N/A"}
              <FieldFilterFacet
                field="metadata.cluster_name"
                value={metadata?.cluster_name ?? "N/A"}
                onClick={props.onChangeFacet}
              />
            </span>
            <span className="index-name">Index:{metadata?.index_name}</span>
            <span className="index-name">
              Status:{metadata?.labels?.state ?? "N/A"}
              <FieldFilterFacet
                field="metadata.labels.state"
                value={metadata?.labels?.state ?? "N/A"}
                onClick={props.onChangeFacet}
              />
            </span>
          </span>
          <span className="cbm">
            <span style={{ display: "flex", gap: 5 }}>
              <span>Health:</span>
              <HealthStatusView status={metadata?.labels?.health_status} />
              <FieldFilterFacet
                field="metadata.labels.health_status"
                value={metadata?.labels?.health_status ?? "N/A"}
                onClick={props.onChangeFacet}
                style={{ paddingLeft: 0 }}
              />
            </span>
          </span>
          {metadata?.owner ? (
            <span className="cbr">
              <Icon type="team" />
              <span className="index-owner-department">
                {metadata?.owner?.[0]?.department}
              </span>
              <span>-</span>
              <span className="index-owner-name">
                {metadata?.owner?.[0]?.name}
              </span>
            </span>
          ) : (
            ""
          )}
        </div>
        <div className="index-info">
          <div className="info-left">
            <div className="info-meta">
              {metadata?.aliases?.length ? (
                <span className="meta-general-label">
                  Aliases:
                  <span className="meta-label-text">
                    {metadata?.aliases?.join(",")}
                  </span>
                </span>
              ) : (
                ""
              )}
              <span className="meta-general-label">
                Timestamp:
                <span className="meta-label-text">{timestamp}</span>
              </span>
              {metadata?.tags ? (
                <span className="meta-general-label">
                  Tags:
                  <Tooltip title={metadata?.tags?.join(",")}>
                    <span className="meta-label-text">
                      {metadata?.tags?.join(",")}
                    </span>
                  </Tooltip>
                </span>
              ) : (
                ""
              )}
              {metadata?.remark ? (
                <span className="meta-general-label">
                  Remark:
                  <span className="meta-label-text">{metadata?.remark}</span>
                </span>
              ) : (
                ""
              )}
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
                <div className="info-meta">
                  <span className="meta-label flex">
                    <span className="meta-label-text">Store Size:</span>
                    <span className="meta-label-value">
                      {summary?.index_info?.store_size?.toUpperCase()}
                    </span>
                  </span>
                  <span className="meta-label flex">
                    <Tooltip
                      title={
                        <span>
                          Docs Deleted:
                          {summary?.docs?.deleted}
                          <br />
                          Docs Total:
                          {summary?.docs?.count}
                        </span>
                      }
                    >
                      <span className="meta-label-text">Docs:</span>
                      <span className="meta-label-value">
                        {formatter.numberToHuman(summary?.docs?.deleted)} /{" "}
                        {formatter.numberToHuman(summary?.docs?.count)}
                      </span>
                    </Tooltip>
                  </span>
                  <span className="meta-label flex">
                    <Tooltip
                      title={
                        <span>
                          Unassigned Shards:
                          {summary?.unassigned_shards}
                          <br />
                          Shards:
                          {summary?.index_info?.shards}
                          <br />
                          Replicas:
                          {summary?.index_info?.replicas || 0}
                        </span>
                      }
                    >
                      <span className="meta-label-text">Shards:</span>
                      <span className="meta-label-value">
                        {summary?.unassigned_shards} /{" "}
                        {summary?.index_info?.shards +
                          (summary?.index_info?.replicas || 0)}
                      </span>
                    </Tooltip>
                  </span>
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

export default IndexCard;
