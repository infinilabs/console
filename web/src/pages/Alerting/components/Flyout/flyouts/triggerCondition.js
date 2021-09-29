/*
 *   Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import React from 'react';
import { EuiCodeBlock, EuiCodeEditor, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import {formatMessage} from 'umi/locale';

const CONTEXT_VARIABLES = JSON.stringify(
  {
    monitor: '...',
    trigger: '...',
    results: '...',
    periodStart: '...',
    periodEnd: '...',
    alert: '...',
    error: '...',
  },
  null,
  4
);

const triggerCondition = context => ({
  flyoutProps: {
    'aria-labelledby': 'triggerConditionFlyout',
    maxWidth: 500,
    size: 'm',
  },
  headerProps: { hasBorder: true },
  header: (
    <EuiTitle size="m" style={{ fontSize: '25px' }}>
      <h2>
        <strong>{formatMessage({id:'alert.trigger.edit.define.field.condition'})}</strong>
      </h2>
    </EuiTitle>
  ),
  body: (
    <div>
      <EuiText style={{ fontSize: '14px' }}>
        <p>{formatMessage({id:'alert.trigger.edit.define.field.condition.info.paragraph1'})}</p>
        <p>
        {formatMessage({id:'alert.trigger.edit.define.field.condition.info.paragraph2'})}
        </p>
      </EuiText>

      <EuiSpacer size="m" />

      <EuiCodeBlock language="json">{CONTEXT_VARIABLES}</EuiCodeBlock>

      <EuiSpacer size="m" />

      <EuiCodeEditor
        mode="json"
        theme="github"
        width="100%"
        height="700px"
        readOnly
        value={JSON.stringify(context, null, 4)}
        setOptions={{ fontSize: '12px' }}
      />
    </div>
  ),
});

export default triggerCondition;
