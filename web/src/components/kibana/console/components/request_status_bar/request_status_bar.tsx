/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { FunctionComponent } from "react";
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiText,
  EuiToolTip,
  EuiCodeBlock,
} from "@elastic/eui";
import { HealthStatusCircle } from "@/components/infini/health_status_circle";
import "./request_status_bar.scss";
import { Drawer, Tabs, Button } from "antd";
import { FormattedMessage, formatMessage } from "umi/locale";

export interface Props {
  requestInProgress: boolean;
  requestResult?: {
    // Status code of the request, e.g., 200
    statusCode: number;

    // Status text of the request, e.g., OK
    statusText: string;

    // Method of the request, e.g., GET
    method: string;

    // The path of endpoint that was called, e.g., /_search
    endpoint: string;

    // The time, in milliseconds, that the last request took
    timeElapsedMs: number;
    responseHeader: string;
    requestHeader: string;
  };
}

const mapStatusCodeToBadgeColor = (statusCode: number) => {
  if (statusCode <= 199) {
    return "default";
  }

  if (statusCode <= 299) {
    return "secondary";
  }

  if (statusCode <= 399) {
    return "primary";
  }

  if (statusCode <= 499) {
    return "warning";
  }

  return "danger";
};

export const RequestStatusBar = ({
  requestInProgress,
  requestResult,
  selectedCluster,
  left,
}: Props) => {
  let content: React.ReactNode = null;
  const clusterContent = (
    <div className="base-info">
      <div className="info-item health">
        <span>
          {" "}
          <FormattedMessage id="console.cluster.status" />：
        </span>
        <i style={{ position: "absolute", top: 1, right: 0 }}>
          <HealthStatusCircle status={selectedCluster.status} />
        </i>
      </div>
      <div className="info-item">
        <span>
          <FormattedMessage id="console.cluster.endpoint" />：
        </span>
        <EuiBadge color="default">{selectedCluster.host}</EuiBadge>
      </div>
      <div className="info-item">
        <span>
          <FormattedMessage id="console.cluster.version" />：
        </span>
        <EuiBadge color="default">{selectedCluster.version}</EuiBadge>
      </div>
    </div>
  );

  if (requestInProgress) {
    content = (
      <EuiFlexItem grow={false}>
        <EuiBadge color="hollow">Request in progress</EuiBadge>
      </EuiFlexItem>
    );
  } else if (requestResult) {
    const {
      endpoint,
      method,
      statusCode,
      statusText,
      timeElapsedMs,
    } = requestResult;

    content = (
      <>
        <div className="status_info">
          <div className="info-item">
            <span>
              <FormattedMessage id="console.response.status" />：
            </span>
            <EuiToolTip
              position="top"
              content={
                <EuiText size="s">{`${method} ${
                  endpoint.startsWith("/") ? endpoint : "/" + endpoint
                }`}</EuiText>
              }
            >
              <EuiText size="s">
                <EuiBadge color={mapStatusCodeToBadgeColor(statusCode)}>
                  {/*  Use &nbsp; to ensure that no matter the width we don't allow line breaks */}
                  {statusCode}&nbsp;-&nbsp;{statusText}
                </EuiBadge>
              </EuiText>
            </EuiToolTip>
          </div>
          <div className="info-item">
            <span>
              <FormattedMessage id="console.response.time_elapsed" />：
            </span>
            <EuiToolTip
              position="top"
              content={<EuiText size="s">Time Elapsed</EuiText>}
            >
              <EuiText size="s">
                <EuiBadge color="default">
                  {timeElapsedMs}&nbsp;{"ms"}
                </EuiBadge>
              </EuiText>
            </EuiToolTip>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="request-status-bar">
      {left ? (
        <div className="bar-item">{clusterContent}</div>
      ) : (
        <div className="bar-item">{content}</div>
      )}
    </div>
  );
};
