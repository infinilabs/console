import { Drawer } from "antd";
import styles from "./index.less";
import { useState } from "react";
import { IMeta } from "..";
import WidgetHeader from "./WidgetHeader";
import WidgetBody from "./WidgetBody";
import WidgetConfig from "./WidgetConfig";

interface IProps {
  queries: {
    indexPattern: string;
    clusterId: string;
    timeField: string;
    getFilters: () => any;
    getBucketSize: () => string;
  };
  record: IMeta;
  onSave: (config: any) => void;
  onRemove: (id: string) => void;
  onUpdate: (record: IMeta) => void;
  draggableHandleCls: string;
}

export default (props: IProps) => {
  const { queries, record, onSave, onRemove, onUpdate, draggableHandleCls } = props;
  const { id, title, series } = record

  const [visible, setVisible] = useState(false);

  const handleSave = () => {
  }

  return (
    <div className={styles.widget}>
      <WidgetHeader 
        draggableHandleCls={draggableHandleCls}
        title={title}
        onSetting={() => setVisible(true)}
        onSave={handleSave}
        onRemove={() => onRemove(id)}
      />
      <WidgetBody queries={queries} record={record} />
      <Drawer
          title={`Widget Setting`}
          width={"70%"}
          visible={visible}
          bodyStyle={{ padding:0, paddingBottom: 54 }}
          onClose={() => setVisible(false)}
      >
        <WidgetConfig 
          record={record} 
          title={title}
          queries={queries}
          series={series[0]}
          onCancel={() => setVisible(false)}
          onUpdate={(newRecord) => {
            onUpdate(newRecord)
            setVisible(false)
          }}
        />
      </Drawer>
    </div>
  );
};
