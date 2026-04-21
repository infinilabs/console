import styles from "./index.scss";
import Info from "./Info";
import Logging from "./Logging";
import Partitions from "./Partitions";
import useFetch from "@/lib/hooks/use_fetch";
import { Spin,Tabs } from "antd";
import { formatMessage } from "umi/locale";

const { TabPane } = Tabs;

export default ({ taskId, record, refreshFlag, logInfo }) => {
  const { sourceIndex, sourceDocType } = record;

  const {
    run,
    loading,
    value,
  } = useFetch(
    `/migration/data/${taskId}/info/${sourceIndex}:${sourceDocType}`,
    {},
    [taskId, sourceIndex, sourceDocType, refreshFlag]
  );

  const { partitions, repeating, next_run_time } = value || {};

  return (
    <Spin spinning={!refreshFlag && loading}>
      <Tabs defaultActiveKey="progress">
      <TabPane tab={formatMessage({id:"migration.title.progress"})} key="progress">
        <Partitions
            loading={loading}
            record={record}
            repeating={repeating}
            data={partitions || []}
            onRefresh={run}
            logInfo={logInfo}
            nextRunTime={next_run_time}
          />
      </TabPane>
      <TabPane tab={formatMessage({id:"migration.title.detail"})} key="detail">
        <Info
          taskId={taskId}
          record={record}
          data={value || {}}
          logInfo={logInfo}
        />
      </TabPane>
      <TabPane tab={formatMessage({id:"migration.title.logging"})} key="logging">
        <Logging taskId={taskId} indexName={`${sourceIndex}:${sourceDocType}`} refreshFlag={refreshFlag}  logInfo={logInfo}/>
      </TabPane>
    </Tabs>
    </Spin>
  );
};
