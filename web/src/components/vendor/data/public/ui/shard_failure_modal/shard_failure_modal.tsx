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

import React from 'react';
import {
  EuiCodeBlock,
  EuiTabbedContent,
  EuiCopy,
  EuiButton,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalFooter,
  EuiButtonEmpty,
  EuiCallOut,
} from '@elastic/eui';
import { SearchResponse } from 'elasticsearch';
import { ShardFailureTable } from './shard_failure_table';
import { ShardFailureRequest } from './shard_failure_types';

export interface Props {
  onClose: () => void;
  request: ShardFailureRequest;
  response: SearchResponse<any>;
  title: string;
}

export function ShardFailureModal({ request, response, title, onClose }: Props) {
  if (
    !response ||
    !response._shards ||
    !Array.isArray((response._shards as any).failures) ||
    !request
  ) {
    // this should never ever happen, but just in case
    return (
      <EuiCallOut title="Sorry, there was an error" color="danger" iconType="alert">
        The ShardFailureModal component received invalid properties
      </EuiCallOut>
    );
  }
  const failures = (response._shards as any).failures;
  const requestJSON = JSON.stringify(request, null, 2);
  const responseJSON = JSON.stringify(response, null, 2);

  const tabs = [
    {
      id: 'table',
      name: 'Shard failures',
      content: <ShardFailureTable failures={failures} />,
    },
    {
      id: 'json-request',
      name: 'Request',
      content: (
        <EuiCodeBlock language="json" isCopyable>
          {requestJSON}
        </EuiCodeBlock>
      ),
    },
    {
      id: 'json-response',
      name: 'Response',
      content: (
        <EuiCodeBlock language="json" isCopyable>
          {responseJSON}
        </EuiCodeBlock>
      ),
    },
  ];

  return (
    <React.Fragment>
      <EuiModalHeader>
        <EuiModalHeaderTitle>{title}</EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        <EuiTabbedContent tabs={tabs} initialSelectedTab={tabs[0]} autoFocus="selected" />
      </EuiModalBody>
      <EuiModalFooter>
        <EuiCopy textToCopy={responseJSON}>
          {(copy) => (
            <EuiButtonEmpty onClick={copy}>
              Copy response to clipboard
            </EuiButtonEmpty>
          )}
        </EuiCopy>
        <EuiButton onClick={() => onClose()} fill data-test-sub="closeShardFailureModal">
         Close
        </EuiButton>
      </EuiModalFooter>
    </React.Fragment>
  );
}
