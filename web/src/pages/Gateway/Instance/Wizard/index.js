import { Button, Card } from "antd";
import { Link } from "umi";
import gatewayBg from "@/assets/gateway_install_bg.svg";
import styles from "./index.less";
import { formatMessage } from "umi/locale";
import InstallGateway from "@/components/InstallGateway";

export default () => {
  return (
    <Card className={styles.wizard}>
      <div className={styles.left}>
        <div className={styles.title}>INFINI Gateway</div>
        <div className={styles.desc}>
          {formatMessage({ id: "gateway.guide.desc" })}
        </div>
        <InstallGateway autoInit={true} />
        <div className={styles.tipsDesc}>
          <div>
            <span style={{ marginRight: 8 }}>
              {formatMessage({ id: "gateway.guide.already_install" })}
            </span>
            <Link to="/resource/runtime/instance/new">
              <Button type="primary">
                {formatMessage({ id: "gateway.guide.click_to_regist" })}
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.wrapper}>
          <img src={gatewayBg} />
        </div>
      </div>
    </Card>
  );
};
