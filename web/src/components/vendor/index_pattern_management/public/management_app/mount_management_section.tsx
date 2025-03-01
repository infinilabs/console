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
import ReactDOM from "react-dom";
import { Router, Switch, Route } from "react-router-dom";
import { StartServicesAccessor } from "src/core/public";

// import { KibanaContextProvider } from '../../../kibana_react/public';
import { ManagementAppMountParams } from "../../../management/public";
import {
  IndexPatternTableWithRouter,
  EditIndexPatternContainer,
  CreateEditFieldContainer,
  CreateIndexPatternWizardWithRouter,
} from "../components";
import {
  IndexPatternManagementStartDependencies,
  IndexPatternManagementStart,
} from "../plugin";
import { IndexPatternManagmentContext, MlCardState } from "../types";

const readOnlyBadge = {
  text: "Read only",
  tooltip: "Unable to save view",
  iconType: "glasses",
};

export async function mountManagementSection(
  getStartServices: StartServicesAccessor<
    IndexPatternManagementStartDependencies
  >,
  params: ManagementAppMountParams,
  getMlCardState: () => MlCardState
) {
  const [
    {
      chrome,
      application,
      savedObjects,
      uiSettings,
      notifications,
      overlays,
      http,
      docLinks,
    },
    { data },
    indexPatternManagementStart,
  ] = await getStartServices();
  const canSave = Boolean(application.capabilities.indexPatterns.save);

  if (!canSave) {
    chrome.setBadge(readOnlyBadge);
  }

  const deps: IndexPatternManagmentContext = {
    chrome,
    application,
    savedObjects,
    uiSettings,
    notifications,
    overlays,
    http,
    docLinks,
    data,
    indexPatternManagementStart: indexPatternManagementStart as IndexPatternManagementStart,
    setBreadcrumbs: params.setBreadcrumbs,
    getMlCardState,
  };

  ReactDOM.render(
    <Router history={params.history}>
      <Switch>
        <Route path={["/create"]}>
          <CreateIndexPatternWizardWithRouter />
        </Route>
        <Route
          path={[
            "/patterns/:id/field/:fieldName",
            "/patterns/:id/create-field/",
          ]}
        >
          <CreateEditFieldContainer />
        </Route>
        <Route path={["/patterns/:id"]}>
          <EditIndexPatternContainer />
        </Route>
        <Route path={["/"]}>
          <IndexPatternTableWithRouter canSave={canSave} />
        </Route>
      </Switch>
    </Router>,
    params.element
  );

  return () => {
    chrome.docTitle.reset();
    ReactDOM.unmountComponentAtNode(params.element);
  };
}
