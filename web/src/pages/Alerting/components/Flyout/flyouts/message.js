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
import { EuiLink, EuiText, EuiTitle } from '@elastic/eui';
import { URL } from '../../../utils/constants';
import {formatMessage} from 'umi/locale';

const message = () => ({
  flyoutProps: {
    'aria-labelledby': 'messageFlyout',
    maxWidth: 500,
    size: 'm',
  },
  headerProps: { hasBorder: true },
  header: (
    <EuiTitle size="m" style={{ fontSize: '25px' }}>
      <h2>
        <strong>{formatMessage({id:"alert.trigger.edit.action.field.message"})}</strong>
      </h2>
    </EuiTitle>
  ),
  body: (
    <EuiText style={{ fontSize: '14px' }}>
      <p>
        {formatMessage({id:"alert.trigger.edit.action.field.message.info.paragraph1"})}
      </p>
      {/* <h3>Learn More</h3>
      <ul>
        <li>
          <EuiLink target="_blank" href={URL.MUSTACHE}>
            HTML Templates with Mustache.js
          </EuiLink>
        </li>
      </ul> */}
    </EuiText>
  ),
});

export default message;
