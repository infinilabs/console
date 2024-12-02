import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import {
  Tabs,
  Card,
  Table,
  Popconfirm,
  Divider,
  Row,
  Col,
  Button,
  Input,
  message,
  Drawer,
  Popover,
  Icon,
  Tooltip,
} from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { Route } from "umi";
import { useCallback, useMemo, useState } from "react";
import request from "@/utils/request";
import QueueMessage from "./message";
import { encodeProxyPath } from "@/lib/util";
import { JsonParam, QueryParamProvider, useQueryParam } from "use-query-params";
import Transient from "./Transient";
import Persistent from "./Persistent";
import { QUEUE_TYPE_DISK, QUEUE_TYPE_KAFKA } from "./QueueTypeIcon";
import "./index.scss";

const { TabPane } = Tabs;

const QueueList = (props) => {
  const [param, setParam] = useQueryParam("_g", JsonParam);
  const [queryParams, setQueryParams] = React.useState({});
  const [resetOffsetData, setResetOffsetData] = React.useState({});
  const [gotoOffset, setGotoOffset] = React.useState("");

  const [selectedRowKeysObject, setSelectedRowKeysObject] = useState({});

  const instanceID = props.match.params.instance_id;
  const { loading, error, value } = useFetch(
    `/instance/${instanceID}/_proxy?method=GET&path=/queue/stats`,
    {
      method: "POST",
      queryParams: queryParams,
    },
    [queryParams]
  );
  //mock api mode
  // const { loading, error, value } = useFetch(
  //   `/queue/stats`,
  //   {
  //     method: "GET",
  //     queryParams: queryParams,
  //   },
  //   [queryParams]
  // );

  const handleMessageList = (queue_id, offset) => {
    setVisible(true);
    setQueueId(queue_id);
    if (offset) {
      let newOffset = offset.split(",")[0] + ",0";
      setGotoOffset(newOffset);
    }
  };

  const formatQueueList = (queueType, queueObj) => {
    let depthList = [];
    let consumerList = [];
    for (let key in queueObj) {
      let item = queueObj[key];
      item.name = item?.metadata?.name;
      item.queue_type = queueType;
      if (item.hasOwnProperty("depth")) {
        depthList.push(item);
      } else {
        consumerList.push(item);
      }
    }
    return { depthList, consumerList };
  };

  const {
    depthQueues,
    depthQueuesTotal,
    consumerQueues,
    consumerQueuesTotal,
  } = React.useMemo(() => {
    if (!value) {
      return [];
    }
    let depthList = [];
    let consumerList = [];
    if (value?.queue?.disk) {
      let tmp = formatQueueList(QUEUE_TYPE_DISK, value?.queue?.disk);
      depthList = [...depthList, ...tmp.depthList];
      consumerList = [...consumerList, ...tmp.consumerList];
    }
    if (value?.queue?.kafka) {
      let tmp = formatQueueList(QUEUE_TYPE_KAFKA, value?.queue?.kafka);
      depthList = [...depthList, ...tmp.depthList];
      consumerList = [...consumerList, ...tmp.consumerList];
    }
    return {
      depthQueues: depthList,
      depthQueuesTotal: depthList.length,
      consumerQueues: consumerList,
      consumerQueuesTotal: consumerList.length,
    };
  }, [value]);

  const [queueId, setQueueId] = React.useState("");
  const [visible, setVisible] = React.useState(false);
  const toggleVisible = () => {
    setVisible(!visible);
  };

  const handleRefresh = () => {
    setQueryParams({
      ...queryParams,
    });
  };

  return (
    <PageHeaderWrapper>
      <Card className="queue-card">
        <Tabs
          activeKey={param?.tab || "transient"}
          onChange={(key) => {
            setParam({ ...param, tab: key });
          }}
          tabBarExtraContent={
            <>
              <Button
                type="primary"
                onClick={() => props.history.go(-1)}
                style={{ marginLeft: 10 }}
              >
                {formatMessage({ id: "form.button.goback" })}
              </Button>
            </>
          }
        >
          <TabPane tab="FIFO" key={"transient"}>
            <Transient
              instanceID={instanceID}
              queueData={{ data: depthQueues, total: depthQueuesTotal }}
              loading={loading}
              onRefresh={handleRefresh}
              handleMessageList={handleMessageList}
              QueueTypeIcon
            />
          </TabPane>
          <TabPane tab="SPMC" key={"persistent"}>
            <Persistent
              instanceID={instanceID}
              queueData={{ data: consumerQueues, total: consumerQueuesTotal }}
              loading={loading}
              onRefresh={handleRefresh}
              handleMessageList={handleMessageList}
              QueueTypeIcon
            />
          </TabPane>
        </Tabs>
      </Card>

      <QueueMessage
        visible={visible}
        queue_id={queueId}
        instance_id={instanceID}
        toggleVisible={toggleVisible}
        gotoOffset={gotoOffset}
      />
    </PageHeaderWrapper>
  );
};

export default (props) => {
  return (
    <QueryParamProvider ReactRouterRoute={Route}>
      <QueueList {...props} />
    </QueryParamProvider>
  );
};
