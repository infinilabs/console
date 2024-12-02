import { Card, Statistic } from "antd";
import styles from "./overview_statistic.scss";

const vstyle = {
  fontSize: 12,
  wordBreak: "break-all",
  fontWeight: "bold",
};

const OverviewStatistic = (props) => {
  const data = props.data || [];
  // const isMask = props.isMask || false;
  return (
    <Card bodyStyle={{ padding: 15, position: "relative" }}>
      {props.children ? props.children : null}
      <div className={`${styles.statistic}`}>
        {data.map((item) => {
          return (
            <Statistic
              key={item.key}
              title={item.title}
              value={item.value}
              valueStyle={item?.vstyle || vstyle}
              prefix={item?.prefix || null}
            />
          );
        })}
      </div>
    </Card>
  );
};

export default OverviewStatistic;
