import { Button, Card, Icon, message } from "antd";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Link } from "umi";
import gatewayBg from "@/assets/gateway_install_bg.svg";
import styles from "./index.less";
import { formatMessage } from "umi/locale";

const shell = `curl -sSL https://get.infini.cloud | bash -s -- -p gateway`;

export default () => {
  return (
    <Card className={styles.wizard}>
      <div className={styles.left}>
        <div className={styles.title}>INFINI Gateway</div>
        <div className={styles.desc}>
          {formatMessage({ id: "gateway.guide.desc" })}
        </div>
        <div className={styles.installTitle}>
          {formatMessage({ id: "gateway.guide.quick_install" })}
        </div>
        <div className={styles.installDesc}>
          {formatMessage({ id: "gateway.guide.quick_install.desc" })}
        </div>
        <div className={styles.shell}>
          <span className={styles.text}>{shell}</span>
          <CopyToClipboard
            text={shell}
            onCopy={() =>
              message.success(
                formatMessage({ id: "gateway.guide.shell.copy.success" })
              )
            }
          >
            <Icon type="copy" className={styles.copy} />
          </CopyToClipboard>
        </div>
        <div className={styles.tipsTitle}>
          {formatMessage({ id: "gateway.guide.tips.title" })}
        </div>
        <div className={styles.tipsDesc}>
          <div style={{ marginBottom: 28 }}>
            · {formatMessage({ id: "gateway.guide.tips.content" })}
            {` `}
            <a
              href="https://www.infinilabs.com/docs/latest/gateway/getting-started/install/"
              target={"_blank"}
            >
              {`${formatMessage({
                id: "gateway.guide.tips.install_manually",
              })}>`}
            </a>
          </div>
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
