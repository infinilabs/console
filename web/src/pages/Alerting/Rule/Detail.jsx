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
import RuleDetail from "./components/RuleDetail";

const Detail = (props) => {
  const [param, setParam] = useQueryParam("_g", JsonParam);
  const ruleID = props.match?.params?.rule_id;
  if (!ruleID) {
    return null;
  }

  return (
    <PageHeaderWrapper>
      <Card >
        <RuleDetail ruleID={ruleID} />
      </Card>
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
