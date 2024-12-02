import React, { useState, useEffect } from "react";
import { Icon, Tooltip } from "antd";
import TinyArea from "@/components/infini/TinyArea";
import { Pie } from "@/components/Charts";
import { formatter } from "@/utils/format";
import { StatusBlockGroup, StatusMask } from "@/components/infini/status_block";

import "./host_card.scss";

const HostCard = (props) => {
  const metadata = props.data._source?.metadata || {};
  const summary = props.data._source?.summary || {};
  const metrics = props.data._source?.metrics || {};
  const used_store_bytes = summary?.used_store_bytes || 0;
  const max_store_bytes = summary?.max_store_bytes || 0;
  const used_memory_bytes = summary?.used_memory_bytes || 0;
  const max_memory_bytes = summary?.max_memory_bytes || 0;
  const storePercent = Math.round((used_store_bytes / max_store_bytes) * 100);
  const memoryPercent = Math.round(
    (used_memory_bytes / max_memory_bytes) * 100
  );
  let locationInfo = "";
  for (let k in metadata?.location) {
    locationInfo += metadata?.location?.[k] + "-";
  }
  locationInfo = locationInfo.substring(0, locationInfo.lastIndexOf("-"));

  const cpuLineData = metrics?.cpu?.data?.map((item) => {
    let val = item?.[1];
    return val != parseInt(val) ? Math.round(val * 100) / 100 : val;
  });

  const IOLineData = metrics?.io?.data?.map((item) => {
    let val = item?.[1];
    return val != parseInt(val) ? Math.round(val * 100) / 100 : val;
  });

  const networkLineData = metrics?.network?.data?.map((item) => {
    let val = item?.[1];
    return val != parseInt(val) ? Math.round(val * 100) / 100 : val;
  });

  return (
    <div className="card-item host-item">
      <div
        className={`a-item ${props.isActive ? "active" : ""}`}
        onClick={() => props.handleItemDetail(props.data)}
      >
        <StatusMask status={summary?.status} label="Host is Offline" />
        <div className="host-basic">
          <span className="cbl">
            <span className="host-name">
              主机名:<span>{metadata?.name || "N/A"}</span>
            </span>
            <span>
              在线时长:<span>{formatter.uptime(summary?.uptime)}</span>
            </span>
          </span>
          {metadata?.location ? (
            <span className="cbm">
              <Icon type="environment" />
              <span className="host-location-provider">
                {metadata?.location?.provider || "N/A"}
              </span>
              <span>-</span>
              <span className="host-location-region">
                {metadata?.location?.region || "N/A"}
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
              <span className="host-owner-department">
                {metadata?.owner?.[0]?.department || "N/A"}
              </span>
              <span>-</span>
              <span className="host-owner-name">
                {metadata?.owner?.[0]?.name || "N/A"}
              </span>
            </span>
          ) : (
            ""
          )}
        </div>
        <div className="host-info">
          <div className="info-left">
            <div className="info-meta">
              <span className="meta-general-label">
                <span className="meta-label-text">
                  {metadata?.network?.[0]?.internal_ip}(
                  {metadata?.network?.[0]?.net_card}) /{" "}
                  {metadata?.network?.[0]?.mac_address}
                </span>
              </span>
              <span className="meta-general-label">
                <span className="meta-label-text">
                  {metadata?.os?.name} | {metadata?.os?.arch} |{" "}
                  {metadata?.os?.version} | {metadata?.os?.available_processors}
                  C| {formatter.bytes(max_memory_bytes)}
                </span>
              </span>
            </div>

            <div className="info-status">
              <div className="info-status-label">
                {metrics?.status?.metric?.label +
                  " " +
                  metrics?.status?.data?.length +
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
                      formatter.bytes(used_store_bytes) +
                      " / " +
                      formatter.bytes(max_store_bytes)
                    }
                  >
                    <Pie
                      animate={false}
                      color={"rgb(24, 144, 255)"}
                      inner={0.6}
                      tooltip={false}
                      margin={[0, 0, 0, 0]}
                      percent={storePercent}
                      height={80}
                      total={storePercent.toString() + "%"}
                    />
                    <div className="pie-label">磁盘使用率</div>
                  </Tooltip>
                </div>
                <div className="pie-item">
                  <Tooltip
                    title={
                      formatter.bytes(used_memory_bytes) +
                      " / " +
                      formatter.bytes(max_memory_bytes)
                    }
                  >
                    <Pie
                      animate={true}
                      color={"#a9b108"}
                      inner={0.6}
                      tooltip={false}
                      margin={[0, 0, 0, 0]}
                      percent={memoryPercent}
                      height={80}
                      total={memoryPercent.toString() + "%"}
                    />
                    <div className="pie-label">内存使用率</div>
                  </Tooltip>
                </div>
              </div>
              <div className="line-chart">
                <div className="line-item">
                  <div className="line-label">
                    {metrics?.cpu?.metric?.label}
                  </div>
                  <div className="line-value">
                    <TinyArea data={cpuLineData} />
                  </div>
                </div>
                <div className="line-item">
                  <div className="line-label">{metrics?.io?.metric?.label}</div>
                  <div className="line-value">
                    <TinyArea data={IOLineData} />
                  </div>
                </div>
                <div className="line-item">
                  <div className="line-label">
                    {metrics?.network?.metric?.label}
                  </div>
                  <div className="line-value">
                    <TinyArea data={networkLineData} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostCard;
