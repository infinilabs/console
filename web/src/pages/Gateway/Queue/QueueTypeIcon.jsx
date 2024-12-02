import { Icon } from "antd";
import KafkaSvg from "@/components/Icons/Kafka";
import DBSvg from "@/components/Icons/DB";

export const QUEUE_TYPE_DISK = "disk";
export const QUEUE_TYPE_KAFKA = "kafka";

export default ({ queue_type }) => {
  switch (queue_type) {
    case QUEUE_TYPE_KAFKA:
      return <Icon component={KafkaSvg} />;
    case QUEUE_TYPE_DISK:
      return <Icon component={DBSvg} />;
    default:
      return "";
  }
};
