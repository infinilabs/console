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

import React from "react";

import { EuiCallOut } from "@elastic/eui";
import { EuiIconType } from "@elastic/eui/src/components/icon/icon";
import { MatchedItem } from "../../../../types";
import { formatMessage } from "umi/locale";

interface StatusMessageProps {
  matchedIndices: {
    allIndices: MatchedItem[];
    exactMatchedIndices: MatchedItem[];
    partialMatchedIndices: MatchedItem[];
  };
  isIncludingSystemIndices: boolean;
  query: string;
  showSystemIndices: boolean;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({
  matchedIndices: {
    allIndices = [],
    exactMatchedIndices = [],
    partialMatchedIndices = [],
  },
  isIncludingSystemIndices,
  query,
  showSystemIndices,
}) => {
  let statusIcon: EuiIconType | undefined;
  let statusMessage;
  let statusColor: "primary" | "success" | "warning" | undefined;

  const allIndicesLength = allIndices.length;

  if (query.length === 0) {
    statusIcon = undefined;
    statusColor = "primary";

    if (allIndicesLength >= 1) {
      statusMessage = (
        <span>
          {formatMessage(
            {
              id: "explore.createview.status.match_index_num",
            },
            { length: allIndicesLength }
          )}
        </span>
      );
    } else if (!isIncludingSystemIndices && showSystemIndices) {
      statusMessage = (
        <span>
          {formatMessage(
            {
              id: "explore.createview.status.match_special_index",
            },
            { length: exactMatchedIndices.length }
          )}
        </span>
      );
    } else {
      statusMessage = (
        <span>
          {" "}
          {formatMessage({
            id: "explore.createview.status.no_match_index",
          })}
        </span>
      );
    }
  } else if (exactMatchedIndices.length) {
    statusIcon = "check";
    statusColor = "success";
    statusMessage = (
      <span>
        &nbsp;{" "}
        {formatMessage(
          {
            id: "explore.createview.status.match_index_num",
          },
          { length: exactMatchedIndices.length }
        )}
      </span>
    );
  } else if (partialMatchedIndices.length) {
    statusIcon = undefined;
    statusColor = "primary";
    statusMessage = (
      <span>
        当前没有匹配任何索引, 但是{" "}
        <strong>有其他 {partialMatchedIndices.length} 个索引</strong> 类似。
      </span>
    );
  } else {
    statusIcon = undefined;
    statusColor = "warning";
    statusMessage = (
      <span>
        {formatMessage(
          {
            id: "explore.createview.status.no_match_but",
          },
          { length: allIndicesLength }
        )}
      </span>
    );
  }

  return (
    <EuiCallOut
      size="s"
      color={statusColor}
      data-test-subj="createIndexPatternStatusMessage"
      iconType={statusIcon}
      title={statusMessage}
    />
  );
};
