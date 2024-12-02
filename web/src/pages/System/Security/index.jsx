import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import {
  Card,
  Table,
  Popconfirm,
  Divider,
  Form,
  Row,
  Col,
  Button,
  Input,
  message,
  Tabs,
  Icon,
} from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import { useGlobal } from "@/layouts/GlobalContext";
import { Route } from "umi";
import { JsonParam, QueryParamProvider, useQueryParam } from "use-query-params";
import { useCallback, useEffect, useMemo } from "react";
import "@/pages/Gateway/list.scss";
import "@/assets/headercontent.scss";
const { TabPane } = Tabs;
import User from "../User/index";
import Role from "../Role/index";

const Security = (props) => {
  const [param, setParam] = useQueryParam("_g", JsonParam);
  return (
    <PageHeaderWrapper>
      <Card>
        <Tabs
          activeKey={param?.tab || "user"}
          onChange={(key) => {
            setParam({ ...param, tab: key });
          }}
        >
          <TabPane tab={<span>User</span>} key="user">
            <User />
          </TabPane>
          <TabPane tab={<span>Role</span>} key="role">
            <Role />
          </TabPane>
        </Tabs>
      </Card>
    </PageHeaderWrapper>
  );
};

export default (props) => {
  return (
    <QueryParamProvider ReactRouterRoute={Route}>
      <Security {...props} />
    </QueryParamProvider>
  );
};
