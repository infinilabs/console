import Sum from "@/components/Icons/Sum";
import { WidgetRender } from "@/pages/DataManagement/View/WidgetLoader";
import request from "@/utils/request";
import { generateId } from "@/utils/utils";
import {Card, Col, Row,Icon, Empty, Tooltip } from "antd";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { formatMessage } from "umi/locale";
import { buildWidgetByRule } from "../../Rule/components/RuleDetail";

export default ({msgItem, range})=>{

  const { rule_id, created, updated, expression } = msgItem;
  const [rule, setRule] = useState()
  const [loading, setLoading] = useState()

  const fetchRule = async (id) => {
    if (!id) {
      setRule()
      return;
    }
    setLoading(true)
    const res = await request(`/alerting/rule/${id}`)
    setRule(res?._source || undefined)
    setLoading(false)
  }

  useEffect(() => {
    fetchRule(rule_id)
  }, [rule_id])

  const widget = useMemo(() => {
    if (!rule) return;
    const { resource = {} } = rule
    return buildWidgetByRule(rule, {
      "cluster_id": resource.resource_id,
      "indices": resource.objects,
      "time_field": resource.time_field,
      "raw_filter": resource.raw_filter,
    }, created, updated)
  }, [JSON.stringify(rule), updated, created])

  const highlightRange = useMemo(() => {
    if (!created || created === updated) return undefined;
    return {
      from: moment(created).valueOf(),
      to: moment(updated).valueOf()
    }
  }, [created, updated])

  return (
    <Card size={"small"} title={
      <>
        {formatMessage({id:"alert.message.detail.alert_metric_status"})}
        <Tooltip title={expression}>
          <Icon component={Sum} style={{color:"rgb(0, 127, 255)", backgroundColor:"#efefef", marginLeft: 5}}/>
        </Tooltip>
      </>
    } bodyStyle={{ height: 250, padding: 1 }} loading={loading}>
      {
        rule ? (
          <WidgetRender widget={widget} range={range} highlightRange={highlightRange} />
        ) : <Empty />
      }
    </Card>
  )
}