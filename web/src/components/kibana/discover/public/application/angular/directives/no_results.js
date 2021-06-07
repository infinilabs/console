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

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import {
  EuiCallOut,
  EuiCode,
  EuiDescriptionList,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
// import { getServices } from '../../../kibana_services';

// eslint-disable-next-line react/prefer-stateless-function
export class DiscoverNoResults extends Component {
  static propTypes = {
    timeFieldName: PropTypes.string,
    queryLanguage: PropTypes.string,
  };

  render() {
    const { timeFieldName, queryLanguage } = this.props;

    let timeFieldMessage;

    if (timeFieldName) {
      timeFieldMessage = (
        <Fragment>
          <EuiSpacer size="xl" />

          <EuiText>
            <h2 data-test-subj="discoverNoResultsTimefilter">
              扩大时间搜索范围
            </h2>

            <p>
              数据视图包含一个时间字段。 您的查询的当前时间段可能没有匹配任何数据, 或者当前时间段可能没有数据。 您可以选择一个包含数据的时间段。
            </p>
          </EuiText>
        </Fragment>
      );
    }

    let luceneQueryMessage;

    if (queryLanguage === 'lucene') {
      const searchExamples = [
        {
          description: <EuiCode>200</EuiCode>,
          title: (
            <EuiText>
              <strong>
                Find requests that contain the number 200, in any field
              </strong>
            </EuiText>
          ),
        },
        {
          description: <EuiCode>status:200</EuiCode>,
          title: (
            <EuiText>
              <strong>
                Find 200 in the status field
              </strong>
            </EuiText>
          ),
        },
        {
          description: <EuiCode>status:[400 TO 499]</EuiCode>,
          title: (
            <EuiText>
              <strong>
                Find all status codes between 400-499
              </strong>
            </EuiText>
          ),
        },
        {
          description: <EuiCode>status:[400 TO 499] AND extension:PHP</EuiCode>,
          title: (
            <EuiText>
              <strong>
                Find status codes 400-499 with the extension php
              </strong>
            </EuiText>
          ),
        },
        {
          description: <EuiCode>status:[400 TO 499] AND (extension:php OR extension:html)</EuiCode>,
          title: (
            <EuiText>
              <strong>
                Find status codes 400-499 with the extension php or html
              </strong>
            </EuiText>
          ),
        },
      ];

      luceneQueryMessage = (
        <Fragment>
          <EuiSpacer size="xl" />

          <EuiText>
            <h3>
              Refine your query
            </h3>

            <p>
              The search bar at the top uses Elasticsearch&rsquo;s support for Lucene  <EuiLink
                      target="_blank"
                      href={''}
                    >
                     Query String syntax
                    </EuiLink>.
                Here are some examples of how you can search for web server logs that have been parsed into a few fields.
            </p>
          </EuiText>

          <EuiSpacer size="m" />

          <EuiDescriptionList type="column" listItems={searchExamples} />

          <EuiSpacer size="xl" />
        </Fragment>
      );
    }

    return (
        <Fragment>
          <EuiSpacer size="xl" />

          <EuiFlexGroup justifyContent="center">
            <EuiFlexItem grow={true} className="dscNoResults">
              <EuiCallOut
                title={
                  "当前查询条件没有匹配的数据"
                }
                color="warning"
                iconType="help"
                data-test-subj="discoverNoResults"
              />
              {timeFieldMessage}
              {luceneQueryMessage}
            </EuiFlexItem>
          </EuiFlexGroup>
        </Fragment>
    );
  }
}
