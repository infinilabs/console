import { Timeline, Card, Spin, Icon, Empty } from "antd";
import styles from "./index.less";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import request from "@/utils/request";
import { useEffect, useState } from "react";
import { Link } from "umi";
import { ESPrefix } from "@/services/common";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { formatMessage } from "umi/locale";
import CardMore from "../CardMore";
import GenerateDesc from "./GenerateDesc";

const opers = {
  delete: "deleted",
  update: "changed",
  create: "created",
};

const iconType = {
  delete: "delete",
  update: "form",
  create: "plus-square",
};

export default () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const bounds = calculateBounds({
      from: "now-3d",
      to: "now",
    });
    const res = await request(`${ESPrefix}/activity/_search`, {
      method: "POST",
      body: {
        from: 0,
        size: 20,
        aggs: [
          { field: "metadata.labels.cluster_name", params: { size: 150 } },
          { field: "metadata.name", params: { size: 300 } },
          { field: "metadata.type", params: { size: 300 } },
        ],
        start_time: bounds.min.valueOf(),
        end_time: bounds.max.valueOf(),
        filter: {},
      },
    });
    if (res && !res.error) {
      setActivities(res.hits?.hits || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className={styles.activities}>
      <div className={styles.header}>
        <div className={styles.title}>
          {formatMessage({ id: "overview.title.cluster_activities" })}
        </div>
      </div>
      <Card className={styles.content} size="small">
        <CardMore linkTo="/cluster/activities" />
        {loading ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Spin spinning={true} />
          </div>
        ) : activities.length > 0 ? (
          <Timeline>
            {activities.map((act) => {
              return (
                <Timeline.Item key={act._id}>
                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                    title={act._source.timestamp}
                  >
                    <Icon
                      type={iconType?.[act._source?.metadata?.type] ?? "edit"}
                      style={{ color: "#1890ff" }}
                      title={act._source?.metadata?.type}
                    />
                    <span title={act._source.timestamp}>
                      {formatUtcTimeToLocal(act._source.timestamp)}
                    </span>
                  </div>
                  <div>
                    <p>
                      <GenerateDesc opers hit={act} />
                    </p>
                  </div>
                </Timeline.Item>
              );
            })}
          </Timeline>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        )}
      </Card>
    </div>
  );
};
