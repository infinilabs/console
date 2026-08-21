import { Drawer, Icon } from 'antd';
import { useMemo, useState } from 'react';
import { IRecord } from '../InsightBar';
import WrappedSaveQueriesForm from './SaveQueriesForm';
import { formatMessage } from 'umi/locale';

interface IProps {
  tags: string[],
  onTagsChange: (tags: string[]) => void,
  loading: boolean;
  record?: IRecord,
  onQueriesSave: (value: IRecord, callback?: () => void) => void;
  data: IRecord[];
}

export default (props: IProps) => {

  const { tags, onTagsChange, loading, record, onQueriesSave, data } = props;

  const [visible, setVisible] = useState(false);

  const onSave = async (newRecord: IRecord) => {
    onQueriesSave(newRecord, () => setVisible(false));
  }

  const isSaved = useMemo(() => {
    return !!record?.id
  }, [record?.id])

  return (
    <>
      <Icon 
        type="save" 
        theme={isSaved ? "filled": ""} 
        title={formatMessage({ id: "explore.save_queries.title" })}
        onClick={() => setVisible(true)}
      />
      <Drawer
        title={formatMessage({ id: "explore.save_queries.title" })}
        placement="right"
        onClose={() => {
          setVisible(false)
        }}
        visible={visible}
        width={500}
        destroyOnClose	
      >
        <WrappedSaveQueriesForm 
          tags={tags} 
          onTagsChange={onTagsChange} 
          record={record} 
          loading={loading} 
          onQueriesSave={onSave}
          data={data}
        />
      </Drawer>
    </>
  )
}