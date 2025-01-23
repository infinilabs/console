import { Form, Steps, Button, message, Spin, Card, Row, Col } from "antd";
import { connect } from "dva";
import { useState, useRef, useEffect } from "react";
import { InitialStep, ExtraStep, ResultStep, MANUAL_VALUE } from "./steps";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import styles from "./step.less";
import { formatMessage } from "umi/locale";
import { formatConfigsValues } from "./utils";
import { Link } from "umi";
import { SearchEngines } from "@/lib/search_engines";

const { Step } = Steps;

const steps = [
  {
    title: formatMessage({
      id: "cluster.regist.step.connect.title",
    }),
  },
  {
    title: formatMessage({
      id: "cluster.regist.step.confirm.title",
    }),
  },
  {
    title: formatMessage({
      id: "cluster.regist.step.complete.title",
    }),
  },
];

const ClusterStep = ({ dispatch, history, query }) => {
  const formRef = useRef();
  const [clusterConfig, setClusterConfig] = useState({
    distribution: Object.values(SearchEngines).includes(query.distribution)
      ? query.distribution
      : SearchEngines.Elasticsearch,
    isTLS: query.schema === "https",
    host: query.host || "",
  });
  const [state, setState] = useState({
    isLoading: false,
    current: 0,
  });
  const changeStep = (step) => {
    setState((st) => {
      return {
        ...st,
        current: step,
      };
    });
  };
  const setIsLoading = (isLoading) => {
    setState((st) => {
      return {
        ...st,
        isLoading: isLoading,
      };
    });
  };
  const isLoading = state.isLoading;
  const current = state.current;
  // const [clusterInfo, setClusterInfo] = useState({});

  const createFormPromise = (type, formatPayload, callback) => {
    return new Promise((resolve, reject) => {
      setIsLoading(true);
      formRef.current.validateFields((errors, values) => {
        if (errors) {
          resolve(false);
          setIsLoading(false);
          return;
        }
        dispatch({
          type,
          payload: formatPayload(values),
        })
          .then((res) => {
            if (res && !res.error) {
              if (callback) {
                callback(values, res);
              }
              resolve(true);
            } else {
              resolve(false);
              setIsLoading(false);
            }
          })
          .catch((err) => {
            setIsLoading(false);
          });
      });
    });
  };

  const next = async () => {
    let result;
    if (current === 0) {
      result = await createFormPromise(
        "clusterConfig/doTryConnect",
        (values) => ({
          basic_auth: {
            username: values.username,
            password: values.password,
          },
          hosts: values.hosts,
          credential_id:
            values.credential_id !== MANUAL_VALUE
              ? values.credential_id
              : undefined,
          schema: values.isTLS === true ? "https" : "http",
        }),
        (values, res) => {
          setClusterConfig({
            ...values,
            ...res,
            raw_name: res.cluster_name,
          });
          setState((st) => {
            return {
              ...st,
              current: st.current + 1,
              isLoading: false,
            };
          });
        }
      );
    } else if (current === 1) {
      result = await createFormPromise(
        "clusterConfig/addCluster",
        (values) => {
          const monitor_configs_new = formatConfigsValues(
            values.monitor_configs
          );
          const metadata_configs_new = formatConfigsValues(
            values.metadata_configs
          );
          clusterConfig.location.region =
            clusterConfig.location.region || "default";
          const newVals = {
            name: values.name,
            version: clusterConfig.version,
            distribution: clusterConfig.distribution,
            host: clusterConfig.host,
            hosts: clusterConfig.hosts,
            location: clusterConfig.location,
            credential_id:
              clusterConfig.credential_id !== MANUAL_VALUE
                ? clusterConfig.credential_id
                : undefined,
            basic_auth: {
              username: clusterConfig.username || "",
              password: clusterConfig.password || "",
            },
            agent_credential_id:
              values.agent_credential_id !== MANUAL_VALUE
                ? values.agent_credential_id
                : undefined,
            agent_basic_auth: {
              username: values.agent_username,
              password: values.agent_password,
            },
            description: values.description,
            enabled: true,
            monitored: values.monitored,
            monitor_configs: monitor_configs_new,
            metadata_configs: metadata_configs_new,
            discovery: {
              enabled: values.discovery.enabled,
            },
            schema: clusterConfig.isTLS ? "https" : "http",
            tags: values.tags,
            cluster_uuid: clusterConfig.cluster_uuid,
            raw_name: clusterConfig.raw_name,
          };
          return newVals;
        },
        () => {
          setState((st) => {
            return {
              ...st,
              current: st.current + 1,
              isLoading: false,
            };
          });
        }
      );
    }
  };

  const prev = () => {
    changeStep(current - 1);
  };

  const oneMoreClick = () => {
    setClusterConfig({});
    changeStep(0);
  };

  const goToClusterList = () => {
    history.push("/resource/cluster");
  };

  const renderContent = (current) => {
    if (current === 0) {
      return <InitialStep ref={formRef} initialValue={clusterConfig} />;
    } else if (current === 1) {
      return <ExtraStep initialValue={clusterConfig} ref={formRef} dispatch={dispatch}/>;
    } else if (current === 2) {
      return (
        <ResultStep
          clusterConfig={clusterConfig}
          oneMoreClick={oneMoreClick}
          goToClusterList={goToClusterList}
        />
      );
    }
  };

  return (
    <PageHeaderWrapper>
      <Card className={styles.steps}>
        <div className={styles.header}>
          {formatMessage({
            id: "cluster.manage.regist.header.title",
          })}
          <Link to={"/resource/cluster"}>
            <Button type="primary">
              {formatMessage({
                id: "form.button.goback",
              })}
            </Button>
          </Link>
        </div>
        <Spin spinning={isLoading}>
          <div className={styles.content}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <Steps current={current} style={{ marginBottom: 40 }}>
                {steps.map((item) => (
                  <Step key={item.title} title={item.title} />
                ))}
              </Steps>
              <div className="steps-content">{renderContent(current)}</div>
              <Form
                {...{
                  labelCol: {
                    xs: { span: 24 },
                    sm: { span: 6 },
                  },
                  wrapperCol: {
                    xs: { span: 24 },
                    sm: { span: 16 },
                  },
                }}
              >
                <Form.Item label={" "} colon={false}>
                  <div style={{ marginLeft: 12 }}>
                    {current === 1 && (
                      <Button style={{ marginRight: 8 }} onClick={() => prev()}>
                        {formatMessage({
                          id: "form.button.pre",
                        })}
                      </Button>
                    )}
                    {current === 0 && (
                      <Button
                        type="primary"
                        style={{ marginRight: 8 }}
                        ghost
                        onClick={() => next()}
                      >
                        {formatMessage({
                          id: "guide.cluster.test.connection",
                        })}
                      </Button>
                    )}
                    {current < steps.length - 1 && (
                      <Button type="primary" onClick={() => next()}>
                        {formatMessage({
                          id: "form.button.next",
                        })}
                      </Button>
                    )}
                  </div>
                </Form.Item>
              </Form>
            </div>
          </div>
        </Spin>
      </Card>
    </PageHeaderWrapper>
  );
};

const NewCluster = (props) => {
  const { dispatch, history, location } = props;
  return (
    <ClusterStep history={history} dispatch={dispatch} query={location.query} />
  );
};

export default connect(({ clusterConfig }) => ({
  clusterConfig,
}))(NewCluster);
