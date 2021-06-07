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

import React, { Fragment } from 'react';

import { EuiCallOut, EuiIcon, EuiLink, EuiSpacer } from '@elastic/eui';


// import { useKibana } from '../../../../../../../plugins/kibana_react/public';
// import { IndexPatternManagmentContext } from '../../../../types';
import {useGlobalContext} from '../../../../context';

export interface ScriptingWarningCallOutProps {
  isVisible: boolean;
}

export const ScriptingWarningCallOut = ({ isVisible = false }: ScriptingWarningCallOutProps) => {
  const docLinksScriptedFields = useGlobalContext().docLinks?.links//useKibana<IndexPatternManagmentContext>().services.docLinks?.links
    .scriptedFields;
  return isVisible ? (
    <Fragment>
      <EuiCallOut
        title={
          "Proceed with caution"
        }
        color="warning"
        iconType="alert"
      >
        <p>
          Please familiarize yourself with  <EuiLink target="_blank" href={docLinksScriptedFields.scriptFields}>
                  script fields
                  &nbsp;
                  <EuiIcon type="link" />
                </EuiLink> and with  <EuiLink target="_blank" href={docLinksScriptedFields.scriptAggs}>
                  scripts in aggregations
                  &nbsp;
                  <EuiIcon type="link" />
                </EuiLink> before using scripted fields.
        </p>
        <p>
          Scripted fields can be used to display and aggregate calculated values. As such, they can be very slow, and
            if done incorrectly, can cause Kibana to be unusable. There's no safety net here. If you make a typo, unexpected exceptions
            will be thrown all over the place!
        </p>
      </EuiCallOut>
      <EuiSpacer size="m" />
    </Fragment>
  ) : null;
};

ScriptingWarningCallOut.displayName = 'ScriptingWarningCallOut';
