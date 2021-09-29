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
    serverBasePath: '',
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
    },
    addSuccess: (message) => {
      notification.success({
        description: message,
      })
    }
  }
}

// const AlertingMain = React.memo(Main)

const AlertingUI =  (props)=>{
  if(!props.selectedCluster.id){
    return null;
  }
  useMemo(()=>{
    httpClient.params.basePath.prepend = (url)=>{
      return  '/elasticsearch/'+ props.selectedCluster.id +"/" + url;
    }
  }, [props.selectedCluster]);
  const isDarkMode = false;
  const history = useMemo(()=>{
    return new ScopedHistory(props.history, '/alerting/monitor');
  }, [props.history])

  return  (
    <CoreContext.Provider key={props.selectedCluster.id}
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