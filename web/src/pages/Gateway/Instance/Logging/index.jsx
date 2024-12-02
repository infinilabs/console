import WebsocketLogViewer from "./viewer";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import {
  Button,
  Card,
  Tabs,
  Select,
} from "antd";
import useFetch from "@/lib/hooks/use_fetch";

const Logging = (props = {}) => {
  const { match } = props;
  const { loading, error, value } = useFetch(
    `/instance/${match.params.instance_id}`,
    null,
    []
  );
  return (
    <PageHeaderWrapper>
      <Card>
        <div>
          <Tabs defaultActiveKey="1">
            <Tabs.TabPane tab="Realtime Logging" key="1">
              {(value && value.found) ?<WebsocketLogViewer instance={value._source || {}}/> : null }
            </Tabs.TabPane>
          </Tabs>
        </div>
      </Card>
    </PageHeaderWrapper>
  );
};

export default Logging;