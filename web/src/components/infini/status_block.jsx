import "./status_block.scss";
import { Icon } from "antd";
import UnLinkSvg from "@/components/Icons/UnLink";

export const StatusBlock = (props) => {
  return (
    <span
      className={`status-block bg-${props?.status || "unavailable"}`}
    ></span>
  );
};

export const StatusBlockGroup = (props) => {
  const blockLength = 14;
  let items = props.data || [];
  let diffLength = 14 - (items?.length ?? 0);
  if (diffLength > 0) {
    for (let i = 0; i < diffLength; i++) {
      items.unshift([0, "unavailable"]);
    }
  }
  return (
    <div className="status-block-group">
      {items.map((item, index) => (
        <StatusBlock status={item?.[1]} key={index} />
      ))}
    </div>
  );
};

/**
 * Cluster、Host、Node等状态不可用时，显示 unavailable 蒙层
 *
 * @param {*} props
 * @returns
 */
export const StatusMask = (props) => {
  const isNA =
    !props?.status ||
    props?.status === "unavailable" ||
    props?.status === "N/A";
  if (isNA) {
    return (
      <div className="item-mask unavailable">
        <span className="mask-label">
          <Icon component={UnLinkSvg} /> {props?.label || "unavailable"}
        </span>
      </div>
    );
  }
  return "";
};

export default StatusBlockGroup;
