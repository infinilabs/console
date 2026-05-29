import { Alert, Button, Icon, Result, Descriptions, Spin } from "antd";
import styles from "./index.less";
import { router } from "umi";
import { formatMessage } from "umi/locale";
import { useEffect } from "react";
import {
  invalidateApplicationSettingsCache,
  refreshApplicationSettings,
} from "@/utils/authority";
import { setSetupRequired } from "@/utils/setup";

export default ({ formData, onPrev }) => {

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
    setupStatus = "success",
    setupError,
  } = formData;

  const isInitializing = setupStatus === "running";
  const isFailed = setupStatus === "failed";

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
    if (!isInitializing && !isFailed) {
      setSetupRequired("false");
      invalidateApplicationSettingsCache();
    }
  }, [isFailed, isInitializing])

  const enterConsole = async () => {
    setSetupRequired("false");
    invalidateApplicationSettingsCache();
    try {
      await refreshApplicationSettings(true);
    } catch (error) {
      console.log(error);
    }
    router.replace("/user/login");
  };

  return (
    <div className={styles.finish}>
      <Result
        icon={
          isInitializing ? (
            <Spin size="large" />
          ) : isFailed ? (
            <Icon type="close-circle" theme="filled" style={{ color: "#ff4d4f" }} />
          ) : (
            <Icon className={styles.success} type="check-circle" theme="filled" />
          )
        }
        title={
          <span className={styles.title}>
            {formatMessage({
              id: isInitializing
                ? "guide.initialization.finish.pending"
                : isFailed
                ? "guide.initialization.finish.failed"
                : "guide.completed",
            })}
          </span>
        }
        extra={
          isInitializing ? (
            <Button type="primary" loading disabled>
              {formatMessage({ id: "guide.initialization.finish.pending.button" })}
            </Button>
          ) : isFailed ? (
            <Button type="primary" onClick={onPrev}>
              {formatMessage({ id: "guide.step.prev" })}
            </Button>
          ) : (
            <Button type="primary" onClick={enterConsole}>
              {formatMessage({ id: "guide.enter.console" })}
            </Button>
          )
        }
      >
        <div className={styles.panels}>
          {isInitializing ? (
            <Alert
              className={`${styles.panel} ${styles.pendingAlert}`}
              message={formatMessage({ id: "guide.initialization.finish.pending.desc" })}
              type="info"
            />
          ) : null}
          {isFailed ? (
            <Alert
            className={`${styles.panel} ${styles.statusAlert}`}
              message={formatMessage({ id: "guide.initialization.finish.failed.desc" })}
              description={setupError}
              type="error"
              showIcon
            />
          ) : null}
          <Descriptions 
            bordered 
            size="small" 
          className={`${styles.panel} ${styles.configTable}`}
            title={formatMessage({ id: "guide.configuration.title" })} 
            column={1}
          >
            <Descriptions.Item label={formatMessage({ id: "guide.configuration.cluster" })}>{isTLS ? `https://${hosts[0]}` : `http://${hosts[0]}`}</Descriptions.Item>
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
          <Alert className={`${styles.panel} ${styles.tipsAlert}`} message={(
            <div>
              {formatMessage({ id: "guide.configuration.tips"})}
              <a style={{ marginLeft: 12 }} onClick={onDownload} ><Icon type={"download"}/></a>
            </div>
          )} type="warning" />
        </div>
      </Result>
    </div>
  );
};
