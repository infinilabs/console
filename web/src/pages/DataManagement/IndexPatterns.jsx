import React, { useEffect, useMemo, useState } from "react";
import { Router, Switch, Route } from "react-router-dom";
import { ScopedHistory } from "../../components/vendor/core/public/application/scoped_history";

import {
  IndexPatternTableWithRouter,
  EditIndexPatternContainer,
  CreateEditFieldContainer,
  CreateIndexPatternWizardWithRouter,
} from "../../components/vendor/index_pattern_management/public/components";
// import '@elastic/eui/dist/eui_theme_amsterdam_light.css';
import { useGlobalContext } from "../../components/vendor/index_pattern_management/public/context";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import styles from "../System/Cluster/step.less";

import { connect } from "dva";
import { ESPrefix } from "@/services/common";
import { formatMessage } from "umi/locale";
import { getAuthority, hasAuthority } from "@/utils/authority";
import EditLayout from "./View/EditLayout";
import { Card, Empty } from "antd";
import { CreateEditComplexFieldContainer } from "@/components/vendor/index_pattern_management/public/components/edit_index_pattern/create_edit_complex_field";

const IndexPatterns = (props) => {
  if (!props.selectedCluster?.id) {
    return <Card ><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /></Card>;
  }
  const history = useMemo(() => {
    return new ScopedHistory(props.history, "/data/views");
  }, [props.history]);

  const createComponentKey = useMemo(() => {
    const { http, uiSettings } = useGlobalContext();
    http.getServerBasePath = () => {
      return `${ESPrefix}/` + props.selectedCluster?.id;
    };
    return "CreateIndexPatternWizard_" + Math.random();
  }, [props.selectedCluster]);

  useEffect(() => {
    const { http, uiSettings } = useGlobalContext();
    const initFetch = async () => {
      const defaultIndex = await http.fetch(
        http.getServerBasePath() + "/setting/defaultIndex"
      );
      uiSettings.set("defaultIndex", defaultIndex, true);
    };
    initFetch();
  }, [props.selectedCluster]);

  return (
    <Router history={history}>
      <Switch>
        <Route path={["/create"]}>
          <PageHeaderWrapper>
            <CreateIndexPatternWizardWithRouter key={createComponentKey} />
          </PageHeaderWrapper>
        </Route>
        <Route
          path={[
            "/patterns/:id/complex/:fieldName/edit",
            "/patterns/:id/complex/create/",
          ]}
        >
          <CreateEditComplexFieldContainer selectedCluster={props.selectedCluster} />
        </Route>
        <Route
          path={[
            "/patterns/:id/field/:fieldName",
            "/patterns/:id/create-field/",
          ]}
        >
          <CreateEditFieldContainer selectedCluster={props.selectedCluster} />
        </Route>
        <Route path={["/patterns/:id"]}>
          <EditIndexPatternContainer selectedCluster={props.selectedCluster} />
        </Route>
        <Route path={["/"]}>
          <IndexPatternTableWithRouter
            canSave={hasAuthority("data.view:all")}
            selectedCluster={props.selectedCluster}
          />
        </Route>
      </Switch>
    </Router>
  );
};

export default connect(({ global }) => ({
  clusterList: global.clusterList,
  clusterStatus: global.clusterStatus,
  selectedCluster: global.selectedCluster,
}))(IndexPatterns);
