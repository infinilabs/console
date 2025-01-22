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
import { withRouter, RouteComponentProps } from "react-router-dom";

import { EuiFlexGroup, EuiFlexItem, EuiPanel } from "@elastic/eui";
// import { IndexPattern, IndexPatternField } from '../../../../../../plugins/data/public';
// import { useKibana } from '../../../../../../plugins/kibana_react/public';
// import { IndexPatternManagmentContext } from '../../../types';
import { IndexHeader } from "../index_header";
import { TAB_SCRIPTED_FIELDS, TAB_INDEXED_FIELDS, TAB_COMPLEX_FIELDS } from "../constants";

import { ComplexFieldEditor } from "../../field_editor/complex_field_editor";
import { useGlobalContext } from "../../../context";
import { IndexPattern, IndexPatternField } from "../../../import";

interface CreateEditFieldProps extends RouteComponentProps {
  indexPattern: IndexPattern;
  mode?: string;
  fieldName?: string;
}

export const CreateEditComplexField = withRouter(
  ({ indexPattern, mode, fieldName, history }: CreateEditFieldProps) => {
    const { uiSettings, data } = useGlobalContext();
    const spec =
      mode === "edit" && fieldName
        ? indexPattern.complexFields.getByName(fieldName)?.spec
        : undefined;

    const url = `/patterns/${indexPattern.id}?_a=(tab:complexFields)`;

    if (mode === "edit" && !spec) {
      history.push(url);
    }

    const redirectAway = () => {
      history.push(url);
    };

    return (
      <EuiPanel paddingSize={"l"}>
        <EuiFlexGroup direction="column">
          <EuiFlexItem>
            <IndexHeader
              indexPattern={indexPattern}
              defaultIndex={uiSettings.get("defaultIndex")}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <ComplexFieldEditor
              indexPattern={indexPattern}
              spec={spec || {}}
              services={{
                saveIndexPattern: data.indexPatterns.updateSavedObject.bind(
                  data.indexPatterns
                ),
                redirectAway,
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }
);
