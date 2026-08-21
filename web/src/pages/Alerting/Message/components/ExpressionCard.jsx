import Sum from "@/components/Icons/Sum";
import { hasAuthority } from "@/utils/authority";
import { Card, Divider, Icon } from "antd";
import { Link } from "umi";
import { formatMessage } from "umi/locale";
import { useLocation } from "react-router-dom";

export default ({expression, ruleID})=>{
  const location = useLocation();
  const ruleDetailLink = {
    pathname: `/alerting/rule/${ruleID}`,
    search: `?back_to=${encodeURIComponent(`${location.pathname}${location.search}`)}`,
  };

  return (
    <Card size="small" title={formatMessage({ id: "alert.rule.table.columnns.expression" })} extra={
      <div>
        <Link to={ruleDetailLink}>{formatMessage({ id: "form.button.view" })}</Link>
        {hasAuthority("alerting.rule:all")?
        <>
        <Divider type="vertical"/>
        <Link to={`/alerting/rule/edit/${ruleID}`}>{formatMessage({ id: "form.button.edit" })}</Link>
        </>: null}
      </div>
    }>
      <div>
       <Icon component={Sum} style={{color:"rgb(0, 127, 255)", backgroundColor:"#efefef", marginRight: 5}}/>{expression}
      </div>
    </Card>
  );

}