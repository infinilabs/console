import Main from './pages/Main';
import { CoreContext } from './utils/CoreContext';
import {Fetch} from  '../../components/kibana/core/public/http/fetch';
import {Router} from 'react-router-dom';
import {useMemo} from 'react';
import {ScopedHistory} from '../../components/kibana/core/public/application/scoped_history';
import {notification} from 'antd';
import {connect} from 'dva'

const httpClient = new Fetch({
  basePath:{
    get: () => '',
    prepend: (url) => url,
    remove: (url) => url,
    serverBasePath: '/elasticsearch',
  }
});
const notifications = {
  toasts: {
    addDanger: ({title, text, toastLifeTimeMs})=>{
      notification.warning({
        message: title,
        description: text,
        duration: toastLifeTimeMs/1000,
      })
    }
  }
}

const AlertingUI =  (props)=>{
  if(!props.selectedCluster.id){
    return null;
  }
  useMemo(()=>{
    httpClient.getServerBasePath = ()=>{
      return  '/api/elasticsearch/'+ props.selectedCluster.id;
    }
  }, [props.selectedCluster]);
  const isDarkMode = false;
  const history = useMemo(()=>{
    return new ScopedHistory(props.history, '/alerting');
  }, [props.history])

  return  (
    <CoreContext.Provider
        value={{ http: httpClient, isDarkMode, notifications: notifications }}
      >
        <Router history={history}>
          <div style={{background:'#fff'}}>
          <Main title="Alerting" {...props} />
          </div>
        </Router>
    </CoreContext.Provider>
  )
}

export default connect(({
  global
})=>({
  selectedCluster: global.selectedCluster,
}))(AlertingUI)