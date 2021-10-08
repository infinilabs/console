import React, { Component, useMemo } from 'react';
import { Switch, Route, Router } from 'react-router-dom';
import CreateDestination from './pages/Destinations/containers/CreateDestination';
import DestinationsList from './pages/Destinations/containers/DestinationsList';
import {Fetch} from  '../../components/kibana/core/public/http/fetch';
import {ScopedHistory} from '../../components/kibana/core/public/application/scoped_history';
import {notification} from 'antd';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

const Destination = ({httpClient, notifications, history})=> {
  return (
    <div style={{ padding: '15px', background:'#fff' }}>
      <Router history={history}>
        <Switch>
          <Route
            path='/create-destination'
            render={(props) => (
              <CreateDestination
                httpClient={httpClient}
                notifications={notifications}
                {...props}
              />
            )}
          />
          <Route
            path="/destinations/:destinationId"
            render={(props) => (
              <CreateDestination
                httpClient={httpClient}
                notifications={notifications}
                {...props}
                edit
              />
            )}
          />
          <Route
            // exact
            // path="/destinations"
            render={(props) => {
              return (
              <DestinationsList
                {...props}
                httpClient={httpClient}
                notifications={notifications}
              />
            )}}
          />
        </Switch>
      </Router>
    </div>
  );
}




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

export default (props)=>{
  const isDarkMode = false;
  const history = useMemo(()=>{
    return new ScopedHistory(props.history, '/alerting/destination');
  }, [props.history])

  return  (
    <PageHeaderWrapper>
       <Destination httpClient={httpClient} notifications={notifications} history={history} />
    </PageHeaderWrapper> 
  )
}