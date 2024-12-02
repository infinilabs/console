import { Drawer, Table, Button, Input, message } from "antd";

import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { useCallback, useEffect, useMemo } from "react";
import request from "@/utils/request";
import { encodeProxyPath } from "@/lib/util";
import MessageHeader from "./MessageHeader";
import InfiniteScroll from "react-infinite-scroller";

const { TextArea } = Input;

const QueueMessage = (props) => {
  const visible = props?.visible || false;
  if (!visible) {
    return null;
  }
  const [messageList, setMessageList] = React.useState([]);

  const [gotoOffset, setGotoOffset] = React.useState(props.gotoOffset || "");
  const [hasMore, setHasMore] = React.useState(true);
  const [queryParams, setQueryParams] = React.useState({
    size: 10,
    offset: props.gotoOffset || "0,0",
  });

  const path = encodeProxyPath(`/queue/${props.queue_id}/_scroll`, queryParams);
  const { loading, error, value } = useFetch(
    `/instance/${props.instance_id}/_proxy?method=GET&path=${path}`,
    {
      method: "POST",
    },
    [queryParams]
  );

  //mock api mode
  // const { loading, error, value } = useFetch(
  //   `/queue/${props.queue_id}/_scroll`,
  //   {
  //     method: "GET",
  //     queryParams: queryParams
  //   },
  //   [queryParams]
  // );

  const columns = useMemo(
    () => [
      {
        title: "Message",
        dataIndex: "message",
        width: 650,
        render: (text, record, index) => (
          <TextArea value={text} autoSize={{ minRows: 1, maxRows: 6 }} />
        ),
      },
      {
        title: "Offset",
        dataIndex: "offset",
      },
      {
        title: "Size",
        dataIndex: "size",
      },
    ],
    [value]
  );
  const maxMessageListLength = 100;
  let messages = value?.messages || [];
  let context = value?.context || {};
  let nextOffset =
    (context?.next_offset &&
      `${context?.next_offset.segment || context?.next_offset.Segment},${context
        ?.next_offset.position || context?.next_offset.Position}`) ||
    "";

  useEffect(() => {
    setHasMore(!!nextOffset);
    if (value?.messages) {
      let messageListNew = gotoOffset
        ? value.messages
        : messageList.concat(value.messages);
      if (messageListNew.length > maxMessageListLength) {
        messageListNew = messageListNew.slice(
          messageListNew.length - maxMessageListLength
        );
      }
      setMessageList(messageListNew);
      if (gotoOffset) {
        // clear the input offset
        setGotoOffset("");
      }
    }
  }, [value]);

  const onLoadMore = () => {
    setQueryParams({ ...queryParams, offset: nextOffset });
  };

  const setGotoOffsetHandler = (offset) => {
    setGotoOffset(offset);
    setQueryParams({ ...queryParams, offset: offset });
  };

  return (
    <Drawer
      title={
        <MessageHeader
          queue_id={props.queue_id}
          gotoOffset={gotoOffset}
          setGotoOffset={setGotoOffsetHandler}
        />
      }
      placement="right"
      closable={false}
      onClose={props.toggleVisible}
      visible={visible}
      width={900}
    >
      <div
        className="demo-infinite-container"
        style={{ height: window.innerHeight - 120, overflow: "auto" }}
      >
        <InfiniteScroll
          initialLoad={false}
          pageStart={0}
          loadMore={onLoadMore}
          hasMore={!loading && hasMore}
          useWindow={false}
        >
          <Table
            size={"small"}
            loading={loading}
            bordered
            dataSource={messageList}
            rowKey={"offset"}
            pagination={false}
            columns={columns}
          />
          <div
            style={{
              padding: "10px",
              textAlign: "center",
              display: hasMore && messageList.length > 0 ? "block" : "none",
            }}
          >
            <Button type="primary" onClick={onLoadMore}>
              Load more
            </Button>
          </div>
        </InfiniteScroll>
      </div>
    </Drawer>
  );
};

export default QueueMessage;
