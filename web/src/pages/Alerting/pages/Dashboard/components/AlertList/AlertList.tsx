import {List} from 'antd';
import {AlertItem, AlertRecord} from './AlertItem';
import './alertlist.scss';

interface AlertListProps {
  dataSource: AlertRecord[];
  pagination?: any;
  title: string;
  onItemClick: (item: AlertRecord)=>void
}

export const AlertList = ({
  dataSource,
  pagination,
  title,
  onItemClick,
}: AlertListProps)=>{
  return (
    <div className="alert-list">
      <div className="title">
        {title}
        <span className="total">({pagination?.total})</span>
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
