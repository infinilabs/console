import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import { Card, Spin, Button, message, Drawer, Popconfirm, Icon } from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { Route } from "umi";
import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import request from "@/utils/request";
import { encodeProxyPath } from "@/lib/util";
import { JsonParam, QueryParamProvider, useQueryParam } from "use-query-params";
import styles from "./index.less";
import { Editor } from "@/components/monaco-editor";
import { hasAuthority } from "@/utils/authority";

const isVisibleManagedConfig = (name = "") => /\.ya?ml$/i.test(name);

const Index = (props) => {
  const [param, setParam] = useQueryParam("_g", JsonParam);
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [config, setConfig] = useState({
    runtime: {},
    main: {},
    configs: {},
  });
  const [currentConfig, setCurrentConfig] = useState({});
  const editorRef = useRef(null);

  const instanceID = props.match.params.instance_id;
  const visibleConfigs = useMemo(() => {
    return Object.keys(config.configs || {}).reduce((result, key) => {
      if (isVisibleManagedConfig(key)) {
        result[key] = config.configs[key];
      }
      return result;
    }, {});
  }, [config.configs]);
  const breadcrumbList = [
    { title: "home", locale: "menu.home", href: "/" },
    { title: "resource", locale: "menu.resource" },
    {
      title: "runtime_instance",
      locale: "menu.resource.runtime.instance",
      href: "/resource/runtime/instance",
    },
    {
      title: "runtime_config",
      locale: "menu.resource.runtime.config",
    },
  ];

  const onRefresh = () => {
    loadConfig();
  };

  const onViewClick = (key) => {
    let obj = config[key] ?? visibleConfigs[key];
    setCurrentConfig(obj);
    if (obj) {
      setParam({ ...param, key: key });
    }
  };

  const onMoutEditor = (editor) => {
    editorRef.current = editor;
  };

  const onUpdateClick = async (name) => {
    if (!editorRef.current) {
      console.log("editorRef.current:", editorRef.current);
      return;
    }
    let configs = {};
    configs[name] = editorRef.current.getValue();
    setBtnLoading(true);
    let res = await request(
      `/instance/${instanceID}/_proxy?method=PUT&path=/config/`,
      {
        method: "POST",
        body: {
          configs: configs,
        },
      }
    );
    setBtnLoading(false);
    if (res?.acknowledged) {
      message.success(formatMessage({ id: "app.message.update.success" }));
      fetchConfigs();
    } else {
      console.log("Update failed:", res);
    }
  };

  const fetchConfigs = async () => {
    let res = await request(
      `/instance/${instanceID}/_proxy?method=GET&path=/config/`,
      {
        method: "POST",
        body: {},
      }
    );
    if (!res.error) {
      let main = res?.main ?? {};
      main.key = "main";
      let configs = res?.configs ?? {};

      setConfig((st) => ({ ...st, main, configs }));
    }
  };

  const fetchRuntimeConfig = async () => {
    let res = await request(
      `/instance/${instanceID}/_proxy?method=GET&path=/config/runtime`,
      {
        method: "POST",
        body: {},
      }
    );
    if (!res.error) {
      let runtime = {
        key: "runtime",
        name: "runtime.json",
        content: res,
      };
      setConfig((st) => ({
        ...st,
        runtime,
      }));
    }
  };

  const loadConfig = async () => {
    setLoading(true);
    await fetchRuntimeConfig();
    await fetchConfigs();
    setLoading(false);
  };

  useEffect(() => {
    //获取所有远程配置数据
    loadConfig();
  }, []);

  useEffect(() => {
    //加载默认配置文件
    let defaultKey = param?.key || "runtime";
    if (config[defaultKey] || visibleConfigs[defaultKey]) {
      onViewClick(defaultKey);
    } else if (config.runtime) {
      onViewClick("runtime");
    }
  }, [config.runtime, config.main, visibleConfigs]);

  const RenderView = ({ data }) => {
    let splits = data?.name?.split(".");
    let fileType = splits?.[splits.length - 1] ?? "yml";
    let content = data?.content ?? "";
    if (fileType == "json") {
      content = typeof content == "string" ? JSON.parse(content) : content;
      content = JSON.stringify(content, null, 2);
    }
    return (
      <Card
        title={data?.name}
        extra={
          hasAuthority("gateway.instance:all") &&
          visibleConfigs?.[data?.name] ? (
            <Popconfirm
              placement="topRight"
              title={formatMessage({
                id: "gateway.instance.config.save.confirm",
                defaultMessage: "Are you sure to save?",
              })}
              onConfirm={() => {
                onUpdateClick(data?.name);
              }}
              okText={formatMessage({
                id: "form.button.ok",
                defaultMessage: "OK",
              })}
              cancelText={formatMessage({
                id: "form.button.cancel",
                defaultMessage: "Cancel",
              })}
            >
              <Button type="primary" loading={btnLoading}>
                {formatMessage({
                  id: "form.button.save",
                  defaultMessage: "Save",
                })}
              </Button>
            </Popconfirm>
          ) : null
        }
      >
        {/* <div>updated:{config?.updated}</div> */}
        {data?.location ? (
          <div className={styles.label}>
            {formatMessage({
              id: "gateway.instance.config.location",
              defaultMessage: "Location",
            })}
            :{data?.location}
          </div>
        ) : null}

        <div className={styles.editor}>
          <Editor
            height="calc(100vh - 100px)"
            language={fileType}
            theme="light"
            value={content}
            options={{
              minimap: {
                enabled: false,
              },
              wordBasedSuggestions: true,
              scrollBeyondLastLine: false,
            }}
            onMount={onMoutEditor}
          />
        </div>
      </Card>
    );
  };

  return (
    <PageHeaderWrapper breadcrumbList={breadcrumbList}>
      <Spin spinning={loading}>
        <div className={styles.config}>
          <Card
            className={styles.menu}
            title={formatMessage({
              id: "gateway.instance.config.files",
              defaultMessage: "Configs",
            })}
            extra={
              <a
                onClick={onRefresh}
                title={formatMessage({
                  id: "form.button.refresh",
                  defaultMessage: "Refresh",
                })}
              >
                <Icon type="redo" style={{ color: "rgba(0, 127, 255, 1)" }} />
              </a>
            }
          >
            <div className={styles.items}>
              <div
                className={`${styles.item} ${
                  currentConfig?.name == "runtime.json" ? styles.selected : ""
                }`}
                onClick={() => {
                  onViewClick("runtime");
                }}
              >
                {formatMessage({
                  id: "gateway.instance.config.runtime",
                  defaultMessage: "Runtime",
                })}
              </div>
              <div className={styles.hr}></div>
              <div
                className={`${styles.item} ${
                  currentConfig?.name == "console.yml" ? styles.selected : ""
                }`}
                onClick={() => {
                  onViewClick("main");
                }}
              >
                {formatMessage({
                  id: "gateway.instance.config.main",
                  defaultMessage: "Main",
                })}
              </div>
              <div className={styles.hr}></div>
              {Object.keys(visibleConfigs).map((item) => {
                return (
                  <div
                    className={`${styles.item} ${
                      currentConfig?.name == item ? styles.selected : ""
                    }`}
                    key={item}
                    onClick={() => {
                      onViewClick(item);
                    }}
                  >
                    <span className={styles.fileName}>{item}</span>
                  </div>
                );
              })}
            </div>
          </Card>
          <div className={styles.view}>
            <RenderView data={currentConfig} />
          </div>
        </div>
      </Spin>
    </PageHeaderWrapper>
  );
};

export default (props) => {
  return (
    <QueryParamProvider ReactRouterRoute={Route}>
      <Index {...props} />
    </QueryParamProvider>
  );
};
