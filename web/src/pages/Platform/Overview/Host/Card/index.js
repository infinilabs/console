import React, { useState, useEffect } from "react";
import { Icon, Tooltip } from "antd";
import TinyArea from "@/components/infini/TinyArea";
import { Pie } from "@/components/Charts";
import { formatter } from "@/utils/format";
import { StatusBlockGroup, StatusMask } from "@/components/infini/status_block";
import { HealthStatusView } from "@/components/infini/health_status_view";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { FieldFilterFacet } from "@/components/Overview/List/FieldFilterFacet";
import { OSPlatformIcon } from "@/lib/os_platforms";
import "./index.scss";
import Styles from "@/components/infini/color.scss";

export default (props) => {
  const data = props.data || {};
  const metadata = data._source || {};
  const info = props.info || {};
  const metrics = info.metrics || {};
  const summary = info.summary || {};

  const { cpu = {}, memory = {}, filesystem_summary = {} } = summary;

  const cpuUsedPercent = Math.round(cpu?.used_percent || 0);

  const memoryTotal = memory["total.bytes"] || 0;
  const memoryUsed = memory["used.bytes"] || 0;
  const memoryFree = memory["available.bytes"] || 0;
  const memoryUsedPercent = Math.round(memory["used.percent"] || 0);

  const diskTotal = filesystem_summary["total.bytes"] || 0;
  const diskUsed = filesystem_summary["used.bytes"] || 0;
  const diskFree = filesystem_summary["free.bytes"] || 0;
  const diskUsedPercent = Math.round(filesystem_summary["used.percent"] || 0);

  const defaultEmptyMetricsData = () => {
    const defaultLen = 14;
    const items = [];
    for (let i = 0; i < defaultLen; i++) {
      items.push([0, 0]);
    }
    return items;
  };

  let metricsNetworkInRate = metrics?.network_in_rate || {};
  let metricsNetworkInRateData =
    metricsNetworkInRate?.data || defaultEmptyMetricsData();
  let networkInRateLineMaxValue = metricsNetworkInRateData?.[0]?.[1] || 0;
  const networkInRateLineData = metricsNetworkInRateData?.map((item) => {
    let val = item?.[1];
    if (networkInRateLineMaxValue < val) {
      networkInRateLineMaxValue = val;
    }
    return val != parseInt(val) ? Math.round(val * 100) / 100 : val;
  });
  networkInRateLineMaxValue =
    networkInRateLineMaxValue != parseInt(networkInRateLineMaxValue)
      ? Math.round(networkInRateLineMaxValue * 100) / 100
      : networkInRateLineMaxValue;
  let networkInRateLineMaxLabel =
    (metricsNetworkInRate?.metric?.label ?? "Network In Rate") +
    " " +
    formatter.bytes(networkInRateLineMaxValue);

  let metricsNetworkOutRate = metrics?.network_out_rate || {};
  let metricsNetworkOutRateData =
    metricsNetworkOutRate?.data || defaultEmptyMetricsData();
  let networkOutRateLineMaxValue = metricsNetworkOutRateData?.[0]?.[1] || 0;
  const networkOutRateLineData = metricsNetworkOutRateData?.map((item) => {
    let val = item?.[1];
    if (networkOutRateLineMaxValue < val) {
      networkOutRateLineMaxValue = val;
    }
    return val != parseInt(val) ? Math.round(val * 100) / 100 : val;
  });
  networkOutRateLineMaxValue =
    networkOutRateLineMaxValue != parseInt(networkOutRateLineMaxValue)
      ? Math.round(networkOutRateLineMaxValue * 100) / 100
      : networkOutRateLineMaxValue;
  let networkOutRateLineMaxLabel =
    (metricsNetworkOutRate?.metric?.label ?? "Network Out Rate") +
    " " +
    formatter.bytes(networkOutRateLineMaxValue);

  const healthStatus = metadata?.agent_status;

  return (
    <div className="card-wrap card-host">
      <div
        className={`card-item ${props.isActive ? "active" : ""}`}
        onClick={() => props.onSelect()}
      >
        <div className="card-metadata">
          <div
            className={`card-status bg-${healthStatus || "unavailable"}`}
          ></div>
          <div className="card-metadata-info">
            <Tooltip
              placement="topLeft"
              title={
                <span>
                  OS: {metadata.os_info?.platform} /{" "}
                  {metadata.os_info?.kernel_arch}
                </span>
              }
            >
              <div className="title">
                <OSPlatformIcon
                  platform={metadata.os_info?.platform}
                  width="20px"
                  height="20px"
                />
                <span className="text">{metadata?.ip}</span>
              </div>
            </Tooltip>

            <div className="info">
              <div className="metric">
                <div className="value">
                  <StatusBlockGroup data={metrics?.agent_status?.data} />
                </div>
                <div className="lable">Recent Host Status(14 day)</div>
              </div>

              <div className="metric">
                <Tooltip placement="topLeft" title={metadata?.name || "-"}>
                  <div className="value host-name">{metadata?.name || "-"}</div>
                </Tooltip>

                <div className="lable">Host Name</div>
              </div>
              <div className="metric">
                <div className="value">
                  <HealthStatusView
                    status={metadata?.agent_status || "offline"}
                    label={metadata?.agent_status || "N/A"}
                  />
                </div>
                <div className="lable">Agent Status</div>
              </div>
            </div>
          </div>
        </div>
        <div className="card-chart">
          <div className="pie-chart">
            <Pie
              animate={false}
              color={"#FEC514"}
              inner={0.6}
              tooltip={false}
              margin={[0, 0, 0, 0]}
              percent={cpuUsedPercent}
              height={80}
              total={`${cpuUsedPercent}%`}
            />

            <div className="pie-label">CPU Usage</div>
          </div>
          <div className="pie-chart">
            <Tooltip
              title={
                <span>
                  Total:{formatter.bytes(diskTotal)}
                  <br />
                  Used:{formatter.bytes(diskUsed)}
                  <br />
                  Free:{formatter.bytes(diskFree)}
                </span>
              }
            >
              <Pie
                animate={true}
                color={"#558EF0"}
                inner={0.6}
                tooltip={false}
                margin={[0, 0, 0, 0]}
                percent={diskUsedPercent}
                height={80}
                total={`${diskUsedPercent}%`}
              />
              <div className="pie-label">Disk Usage</div>
            </Tooltip>
          </div>
          <div className="pie-chart">
            <Tooltip
              title={
                <span>
                  Total:{formatter.bytes(memoryTotal)}
                  <br />
                  Used:{formatter.bytes(memoryUsed)}
                  <br />
                  Free:{formatter.bytes(memoryFree)}
                </span>
              }
            >
              <Pie
                animate={true}
                color={"#00BFB3"}
                inner={0.6}
                tooltip={false}
                margin={[0, 0, 0, 0]}
                percent={memoryUsedPercent}
                height={80}
                total={`${memoryUsedPercent}%`}
              />
              <div className="pie-label">MEM Usage</div>
            </Tooltip>
          </div>
          <div className="line-chart">
            <div className="line-item">
              <div className="line-value">
                <TinyArea data={networkOutRateLineData} />
              </div>
              <div className="line-label">{networkOutRateLineMaxLabel}</div>
            </div>
            <div className="line-item">
              <div className="line-value">
                <TinyArea data={networkInRateLineData} />
              </div>
              <div className="line-label">{networkInRateLineMaxLabel}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
