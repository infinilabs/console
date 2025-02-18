import { Alert, Button, Icon, Result, Descriptions } from "antd";
import styles from "./index.less";
import { Link } from "umi";
import { formatMessage } from "umi/locale";
import { useEffect } from "react";

export default ({ formData }) => {

  const {
    host,
    isTLS,
    isAuth,
    username,
    password,
    isInit,
      hosts = [],
    bootstrap_username,
    bootstrap_password,
    credential_secret,
  } = formData;

  const onDownload = () => {
    let hostV = host
    if (!hostV && hosts.length > 0) {
      hostV = hosts[0]
    }
    const data = {
      "Cluster": isTLS ? `https://${hostV}` : `http://${hostV}`,
      "Cluster Username": username,
      "Cluster Password": password,
      "Cluster Username": username,
      "Cluster Password": password,
    }
    if (isAuth) {
      data["Cluster Username"] = username
      data["Cluster Password"] = password
    }
    if (isInit) {
      data["Console Username"] = bootstrap_username
      data["Console Password"] = bootstrap_password
    }
    data["Console Credential Secret"] = credential_secret
    const blob = new Blob([JSON.stringify(data, undefined, 4)], {type: 'text/json'}),
    a = document.createElement('a')
    a.download = "console_configuration.json"
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')
    a.click();
  }

  useEffect(() => {
    localStorage.setItem("first-login",true);
  }, [])

  return (
    <div className={styles.finish}>
      <Result
        icon={
          <Icon className={styles.success} type="check-circle" theme="filled" />
        }
        title={
          <span className={styles.title}>
            {formatMessage({ id: "guide.completed" })}
          </span>
        }
        extra={
          <Link to="/user/login">
            <Button
              type="primary"
              onClick={() => {
                localStorage.removeItem("infini-setup-required");
              }}
            >
              {formatMessage({ id: "guide.enter.console" })}
            </Button>
          </Link>
        }
      >
        <Descriptions 
          bordered 
          size="small" 
          style={{width: "60%", margin: "auto", textAlign: 'center'}} 
          title={formatMessage({ id: "guide.configuration.title" })} 
          column={1}
        >
          <Descriptions.Item label={formatMessage({ id: "guide.configuration.cluster" })}>{isTLS ? `https://${host}` : `http://${host}`}</Descriptions.Item>
          {
            isAuth && (
              <>
              <Descriptions.Item label={formatMessage({ id: "guide.configuration.cluster_username" })}>{username}</Descriptions.Item>
                <Descriptions.Item label={formatMessage({ id: "guide.configuration.cluster_password" })}>{password.split("").map(() => "*")}</Descriptions.Item>
              </>
            )
          }
          {
            isInit && (
              <>
                <Descriptions.Item label={formatMessage({ id: "guide.configuration.console_username" })}>{bootstrap_username}</Descriptions.Item>
                <Descriptions.Item label={formatMessage({ id: "guide.configuration.console_password" })}>{bootstrap_password.split("").map(() => "*")}</Descriptions.Item>
                </>
            )
          }
          <Descriptions.Item label={formatMessage({ id: "guide.configuration.credential_secret" })}>{credential_secret}</Descriptions.Item>
        </Descriptions>
        <Alert style={{width: "60%", margin: "auto", marginTop: 12, textAlign: 'center'}} message={(
          <div>
            {formatMessage({ id: "guide.configuration.tips"})}
            <a style={{ marginLeft: 12 }} onClick={onDownload} ><Icon type={"download"}/></a>
          </div>
        )} type="warning" />
      </Result>
    </div>
  );
};
