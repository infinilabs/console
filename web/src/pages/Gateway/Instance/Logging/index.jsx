import WebsocketLogViewer from "./viewer";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import { Button, Card, Tabs } from "antd";
import useFetch from "@/lib/hooks/use_fetch";
import { formatMessage } from "umi/locale";

const Logging = (props = {}) => {
  const { match } = props;
  const { loading, error, value } = useFetch(
    `/instance/${match.params.instance_id}`,
    null,
    []
  );
  const breadcrumbList = [
    { title: "home", locale: "menu.home", href: "/" },
    { title: "resource", locale: "menu.resource" },
    {
      title: "runtime_instance",
      locale: "menu.resource.runtime.instance",
      href: "/resource/runtime/instance",
    },
    {
      title: "runtime_logging",
      locale: "menu.resource.runtime.logging",
    },
  ];
  return (
    <PageHeaderWrapper breadcrumbList={breadcrumbList}>
      <Card>
        <div>
          <Tabs
            defaultActiveKey="1"
            tabBarExtraContent={
              <Button
                type="primary"
                onClick={() => props.history.go(-1)}
                style={{ marginLeft: 10 }}
              >
                {formatMessage({ id: "form.button.goback" })}
              </Button>
            }
          >
            <Tabs.TabPane
              tab={formatMessage({ id: "gateway.instance.logging.tab.realtime" })}
              key="1"
            >
              {value && value.found ? (
                <WebsocketLogViewer instance={value._source || {}} />
              ) : null}
            </Tabs.TabPane>
          </Tabs>
        </div>
      </Card>
    </PageHeaderWrapper>
  );
};

export default Logging;
