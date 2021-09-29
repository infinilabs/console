import {List} from 'antd';
import {AlertItem, AlertRecord} from './AlertItem';
import './alertlist.scss';
import {Legend, LegendItem} from './Legend';

interface AlertListProps {
  dataSource: AlertRecord[];
  pagination?: any;
  title: string;
  onItemClick: (item: AlertRecord)=>void;
  legendItems?: LegendItem[];
}

export const AlertList = ({
  dataSource,
  pagination,
  title,
  onItemClick,
  legendItems
}: AlertListProps)=>{
  return (
    <div className="alert-list">
      <div className="header">
        <div className="title">
          {title}
          <span className="total">({pagination?.total})</span>
        </div>
        {
          legendItems ? ( <div className="legend">
          <Legend items={legendItems}/>
          </div>):null
        }
       
      </div> 
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
  </div>
  )
  
}
