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

import {
  EuiBetaBadge,
  EuiSpacer,
  EuiTitle,
  EuiText,
  EuiCode,
  EuiLink,
} from "@elastic/eui";

import { DocLinksStart } from "kibana/public";
// import { useKibana } from '../../../../../../../plugins/kibana_react/public';
// import { IndexPatternManagmentContext } from '../../../../types';
import { formatMessage } from "umi/locale";

export const Header = ({
  prompt,
  indexPatternName,
  isBeta = false,
  docLinks,
}: {
  prompt?: React.ReactNode;
  indexPatternName: string;
  isBeta?: boolean;
  docLinks: DocLinksStart;
}) => {
  //const changeTitle = useKibana<IndexPatternManagmentContext>().services.chrome.docTitle.change;
  const createIndexPatternHeader = formatMessage({
    id: "explore.createview.title",
  });

  //changeTitle(createIndexPatternHeader);

  return (
    <div>
      <EuiTitle>
        <h1>
          {createIndexPatternHeader}
          {isBeta ? (
            <>
              {" "}
              <EuiBetaBadge label={"Beta"} />
            </>
          ) : null}
        </h1>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiText>
        <p>
          一个数据视图可以匹配单个索引, 比如, <EuiCode>server-log-1</EuiCode>,
          或者 <strong>多个</strong> 索引, <EuiCode>server-log-*</EuiCode>.
          <br />
          {/* <EuiLink href={docLinks.links.indexPatterns.introduction} target="_blank" external>
            阅读文档
          </EuiLink> */}
        </p>
      </EuiText>
      {prompt ? (
        <>
          <EuiSpacer size="m" />
          {prompt}
        </>
      ) : null}
    </div>
  );
};
