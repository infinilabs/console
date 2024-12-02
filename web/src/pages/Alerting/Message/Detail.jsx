import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import { Card, Form, Row, Col, Button, message, Divider } from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { useGlobal } from "@/layouts/GlobalContext";
import router from "umi/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import request from "@/utils/request";
import moment from "moment";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { filterSearchValue, sorter, formatUtcTimeToLocal } from "@/utils/utils";
import { HealthStatusView } from "@/components/infini/health_status_view";
import { Route } from "umi";
import { JsonParam, QueryParamProvider, useQueryParam } from "use-query-params";
import EventDetail from "./components/EventDetail";

const Detail = (props) => {
  const [param, setParam] = useQueryParam("_g", JsonParam);
  const messageID = props.match?.params?.message_id;

  return (
    <PageHeaderWrapper>
        <EventDetail messageID={messageID} />
    </PageHeaderWrapper>
  );
};

export default (props) => {
  return (
    <QueryParamProvider ReactRouterRoute={Route}>
      <Detail {...props} />
    </QueryParamProvider>
  );
};
