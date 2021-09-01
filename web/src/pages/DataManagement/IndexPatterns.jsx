import React, { useEffect, useMemo, useState } from 'react';
import { Router, Switch, Route } from 'react-router-dom';
import {ScopedHistory} from '../../components/kibana/core/public/application/scoped_history';

import {
  IndexPatternTableWithRouter,
  EditIndexPatternContainer,
  CreateEditFieldContainer,
  CreateIndexPatternWizardWithRouter,
} from '../../components/kibana/index_pattern_management/public/components';
// import '@elastic/eui/dist/eui_theme_amsterdam_light.css';
import {useGlobalContext} from '../../components/kibana/index_pattern_management/public/context';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from '../System/Cluster/step.less';
import clusterBg from '@/assets/cluster_bg.png';

import { connect } from 'dva';


const createContent = (
  <div className={styles.pageHeaderContent}>
    <p>
    一个数据视图可以匹配单个索引, 比如, server-log-1, 或者 多个 索引, server-log-*.
    </p>
  </div>
);

const createExtraContent = (
  <div className={styles.extraImg}>
    <img
      alt="创建视图"
      src={clusterBg}
    />
  </div>
);

const IndexPatterns = (props)=> {
  const history = useMemo(()=>{
    return new ScopedHistory(props.history, '/data/views');
  }, [props.history])

  const createComponentKey = useMemo(()=>{
    const {http, uiSettings} = useGlobalContext();
    http.getServerBasePath = ()=>{
      return  '/elasticsearch/'+ props.selectedCluster.id;
    }
    return 'CreateIndexPatternWizard_'+Math.random();
  },[props.selectedCluster]);

  useEffect(()=>{
    const {http, uiSettings} = useGlobalContext();
    const initFetch = async ()=>{
      const defaultIndex = await http.fetch(http.getServerBasePath()+'/setting/defaultIndex');
      uiSettings.set('defaultIndex', defaultIndex, true);
    }
    initFetch();
  }, [props.selectedCluster]);

  

  return  (
      <Router history={history}>
        <Switch>
          <Route path={['/create']} >
            <PageHeaderWrapper title="创建视图" content={createContent} extraContent={createExtraContent}>
              <CreateIndexPatternWizardWithRouter key={createComponentKey} />
            </PageHeaderWrapper>
          </Route>
          <Route path={['/patterns/:id/field/:fieldName', '/patterns/:id/create-field/']}>
            <CreateEditFieldContainer selectedCluster={props.selectedCluster}/>
          </Route>
          <Route path={['/patterns/:id']} >
            <EditIndexPatternContainer selectedCluster={props.selectedCluster}/>
          </Route>
          <Route path={['/']} >
            <IndexPatternTableWithRouter canSave={true} selectedCluster={props.selectedCluster}/>
          </Route>
          </Switch>
      </Router>
     )
}

export default connect(({
  global
})=>({
  selectedCluster: global.selectedCluster,
}))(IndexPatterns)