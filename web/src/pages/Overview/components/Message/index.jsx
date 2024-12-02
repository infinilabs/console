import request from "@/utils/request";
import { Card, Divider, Spin } from "antd";
import { useEffect, useState } from "react";
import IconTitle from "../IconTitle";
import styles from "./index.less";
import { formatMessage } from "umi/locale";
import CardMore from "../CardMore";
import { Link } from "umi";

const icon = () => (
  <svg
    class="icon"
    width="1em"
    height="1em"
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M173.07 800.98c0 33.81 27.5 61.3 61.3 61.3h555.44c33.81 0 61.3-27.5 61.3-61.3V575.52c0-186.93-152.09-339.02-339.02-339.02S173.07 388.58 173.07 575.52v225.46z m60.69-225.46c0-153.48 124.86-278.34 278.34-278.34s278.34 124.86 278.34 278.34l-0.62 226.09H379.9V658.79c0-16.76-13.58-30.34-30.34-30.34h-3.9c-16.76 0-30.34 13.58-30.34 30.34V801.6h-80.94c-0.37 0-0.62-0.26-0.62-0.62V575.52zM839.52 892.55H184.68c-16.76 0-30.34 13.58-30.34 30.34v3.9c0 16.76 13.58 30.34 30.34 30.34h654.83c16.76 0 30.34-13.58 30.34-30.34v-3.9c0.01-16.76-13.58-30.34-30.33-30.34zM510.15 190.17h3.9c16.76 0 30.34-13.58 30.34-30.34V97.47c0-16.76-13.58-30.34-30.34-30.34h-3.9c-16.76 0-30.34 13.58-30.34 30.34v62.36c0 16.76 13.58 30.34 30.34 30.34zM879.35 215.74l-2.75-2.75c-11.85-11.85-31.06-11.85-42.91 0l-44.1 44.1c-11.85 11.85-11.85 31.06 0 42.91l2.75 2.75c11.85 11.85 31.06 11.85 42.91 0l44.1-44.1c11.85-11.85 11.85-31.06 0-42.91zM231.85 303.5l2.75-2.75c11.85-11.85 11.85-31.06 0-42.91l-44.1-44.1c-11.85-11.85-31.06-11.85-42.91 0l-2.75 2.75c-11.85 11.85-11.85 31.06 0 42.91l44.1 44.1c11.85 11.85 31.06 11.85 42.91 0z"
      fill="#2c2c2c"
    />
  </svg>
);

export default (props) => {
  const { currentUser } = props;
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const res = await request(`/alerting/message/_stats`, {
      method: "GET",
    });
    if (res?.alert?.current && !res?.error) {
      setStats(res.alert.current);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Card className={styles.message} size="small">
      <CardMore linkTo="/" />
      <IconTitle title="message" icon={icon} />
      <div className={styles.statistics}>
        {loading ? (
          <Spin spinning={true} />
        ) : (
          <>
            <div className={styles.item}>
              <Link to={"/alerting/message"}>
                <div
                  className={styles.num}
                  style={{ color: "rgba(224,32,32,1)" }}
                >
                  {stats.critical +
                    stats.high +
                    stats.medium +
                    stats.info +
                    stats.low || 0}
                </div>
              </Link>
              <div className={styles.desc}>
                {formatMessage({ id: "overview.message.alert" })}
              </div>
            </div>
            <Divider type="vertical" />
            <div className={styles.item}>
              <Link to={`/account/notification?_g={"type":"notification"}`}>
                <div
                  className={styles.num}
                  style={{ color: "rgb(2, 127, 254)" }}
                >
                  {currentUser.notifyCount || 0}
                </div>
                <div className={styles.desc}>
                  {formatMessage({ id: "overview.message.notice" })}
                </div>
              </Link>
            </div>
            <Divider type="vertical" />
            <div className={styles.item}>
              <div className={styles.num} style={{ color: "rgb(2, 127, 254)" }}>
                0
              </div>
              <div className={styles.desc}>
                {formatMessage({ id: "overview.message.todo" })}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
