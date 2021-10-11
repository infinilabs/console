import {List, ConfigProvider, Button} from 'antd';
import {AlertItem, AlertRecord} from './AlertItem';
import './alertlist.scss';
import {Legend, LegendItem} from './Legend';
import {router} from 'umi';


interface AlertListProps {
  dataSource: AlertRecord[];
  pagination?: any;
  title: string;
  onItemClick: (item: AlertRecord)=>void;
  legendItems?: LegendItem[];
  onEmptyClick?: ()=>void;
}

export const AlertList = ({
  dataSource,
  pagination,
  title,
  onItemClick,
  legendItems,
  onEmptyClick,
}: AlertListProps)=>{
  if(typeof onEmptyClick !== 'function'){
    onEmptyClick = ()=>{
      router.push('/alerting/monitor/create-monitor');
    }
  }

  const AlertRenderEmpty = ()=>{
    return <div>
      <Button type="primary" onClick={onEmptyClick}>创建监控项</Button>
    </div>
  }
  return (
    <div className="alert-list-layout">
       <div className="title">
            {title}
            <span className="total">({pagination?.total})</span>
      </div>
      <div className="alert-list">
        <div className="header">
          {
            legendItems ? ( <div className="legend">
            <Legend items={legendItems}/>
            </div>):null
          }
        
        </div> 
        <ConfigProvider renderEmpty={AlertRenderEmpty}>
          <List
          itemLayout="vertical"
          size="large"
          pagination={{
            onChange: page => {
              console.log(page);
            },
            pageSize: 20,
            ...pagination,
          }}
          dataSource={dataSource}
          renderItem={item => (
            <AlertItem item={item} onClick={onItemClick}  />
          )}
          />
        </ConfigProvider>
    </div>
    </div>
  )
  
}
