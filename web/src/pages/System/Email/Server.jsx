import {Card, Tabs, Icon, Popconfirm, message} from 'antd';
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
const {TabPane} = Tabs;
import ServerConfig from './Components/ServerConfig';
import "./server.scss";
import { useEffect, useState } from 'react';
import request from '@/utils/request';
import { formatESSearchResult } from '@/lib/elasticsearch/util';
import { formatMessage } from "umi/locale";
import EmptyServer from './Components/EmptyServer';

const ServerList = ({})=>{

  const [loading, setLoading] = useState(false);
  
  const fetchServers = async ()=>{
    setLoading(true)
    const searchRes = await request('/email/server/_search', {
      method: "GET",
    });
    if(!searchRes.error){
      const result = formatESSearchResult(searchRes);
      let activeKey = ""
      if(result.data.length > 0){
        activeKey = result.data[0].id;
      }
      setState(st=>{
        return {
          ...st,
          servers: result.data,
          activeKey,
        }
      })
    }
    setLoading(false)
  }

  useEffect(()=>{
    fetchServers();
  }, [])

  const [state, setState] = useState({
    servers:[],
   activeKey: "",
  });
  const handleTabChange = (key) => {
    if (key === "add") {
      onEmptyAddClick();
      return;
    }
    setState((st)=>{
      return {
        ...st,
        activeKey: key,
      }
    })
  }
  const onDeleteClick = async (key)=>{
    //todo sync to server
    if(!key.startsWith("tmp_")){
      const deleteRes = await request(`/email/server/${key}`, {
        method: "DELETE",
      });
      if (deleteRes && deleteRes.result == "deleted") {
        message.success("delete succed");
      }
    }
    setState(st=>{
      const servers = st.servers.filter((srv)=>{
        return srv.id != key;
      });
      let activeKey = st.activeKey;
      if(st.activeKey == key && servers.length > 0){
        activeKey = servers[0].id;
      }
      return {
        ...st,
        servers,
        activeKey
      }
    })
  }

  const onRefresh = () => {
    setTimeout(() => {
      fetchServers()
    }, 500)
  }

  const onSaveClick = async (values) => {
      let newVal = {
        ...values,
      };
      delete newVal["sendTo"];
      if(values.id.startsWith("tmp_")){
        delete newVal["id"];
        const saveRes = await request('/email/server', {
          method: "POST",
          body: newVal,
        });
        if (saveRes && saveRes.result == "created") {
          setState(st=>{
            const servers = st.servers.map(srv=>{
              if(srv.id == values.id){
                return {
                  ...newVal,
                  id: saveRes._id,
                }
              }
              return srv;
            });
            let activeKey = st.activeKey;
            if(activeKey == values.id){
              activeKey = saveRes._id;
            }
            return {
              ...st,
              servers,
              activeKey
            }
          })
          message.success(
            formatMessage({
              id: "app.message.save.success",
            })
          );
          onRefresh()
        }
      }else{
        const saveRes = await request(`/email/server/${newVal.id}`, {
          method: "PUT",
          body: newVal,
        });
        if (saveRes && saveRes.result == "updated") {
          message.success(
            formatMessage({
              id: "app.message.save.success",
            })
          );
          onRefresh()
        }
      }
     
  };
  const onEmptyAddClick = ()=>{
    setState(st=>{
      const newCfg = {name:"New Config Name", id: "tmp_"+new Date().valueOf()};
      return {
        servers: [...(st.servers || []), newCfg],
        activeKey: newCfg.id,
      }
    })
  }
  return (
    <PageHeaderWrapper>
      <Card loading={loading}>
        {state.servers.length == 0 ? <EmptyServer onAddClick={onEmptyAddClick}/>:
        <Tabs
          hideAdd
          onChange={handleTabChange}
          activeKey={state.activeKey}
          type="editable-card"
          // onEdit={this.onEdit}
        >
          {state.servers.map(cfg => (
            <TabPane 
            tab={<span className='srv-tab'>{cfg.name}
             <Popconfirm
                  title="Sure to delete?"
                  onConfirm={() => onDeleteClick(cfg.id)}
                >
                  <Icon type="close"/>
              </Popconfirm>
            </span>} 
            key={cfg.id} closable={false} >
              <ServerConfig config={cfg} setState={setState} onSaveClick={onSaveClick}/>
              <div></div>
            </TabPane>
          ))}
           <TabPane tab={<span>
          <Icon type="plus" />
        </span>} key="add" closable={false} />
        </Tabs>}
      </Card>
    </PageHeaderWrapper>
  );
}

export default ServerList;