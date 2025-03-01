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
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiButtonEmpty,
  EuiSpacer,
} from "@elastic/eui";

interface AdvancedOptionsProps {
  isVisible: boolean;
  indexPatternId: string;
  toggleAdvancedOptions: (e: React.FormEvent<HTMLButtonElement>) => void;
  onChangeIndexPatternId: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({
  isVisible,
  indexPatternId,
  toggleAdvancedOptions,
  onChangeIndexPatternId,
}) => (
  <div>
    <EuiButtonEmpty
      iconType={isVisible ? "arrowDown" : "arrowRight"}
      onClick={toggleAdvancedOptions}
    >
      {isVisible ? "Hide advanced settings" : "Show advanced settings"}
    </EuiButtonEmpty>
    <EuiSpacer size="xs" />
    {isVisible ? (
      <EuiForm>
        <EuiFormRow
          label={"Custom View ID"}
          helpText={
            "Infini Data Platform will provide a unique identifier for each view. If you do not want to use this unique ID, enter a custom one."
          }
        >
          <EuiFieldText
            name="indexPatternId"
            data-test-subj="createIndexPatternIdInput"
            value={indexPatternId}
            onChange={onChangeIndexPatternId}
            placeholder={"custom-index-pattern-id"}
          />
        </EuiFormRow>
      </EuiForm>
    ) : null}
  </div>
);
