import { useEffect, useState } from 'react';
import { Alert, Button, Divider, Form, Icon, Input, InputNumber, message, Result, Spin, Switch, Tooltip } from 'antd';
import styles from './index.less'
import request from '@/utils/request';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { formatMessage } from "umi/locale";


const defaultAutoExpandReplicas = "0-1";
const defaultEnableRollup = true;

const getRecommendedPrimaryShards = ({ number_of_data_nodes, number_of_nodes } = {}) => {
    const dataNodes = Number(number_of_data_nodes) || 0;
    const totalNodes = Number(number_of_nodes) || 0;
    return Math.max(1, dataNodes || totalNodes || 1);
};

const isValidAutoExpandReplicas = (value) => /^(false|all|\d+-\d+)$/.test((value || '').trim());

const compareVersions = (currentVersion, targetVersion) => {
    const current = `${currentVersion || ''}`.split('.').map((item) => parseInt(item, 10) || 0);
    const target = `${targetVersion || ''}`.split('.').map((item) => parseInt(item, 10) || 0);
    const size = Math.max(current.length, target.length);

    for (let i = 0; i < size; i += 1) {
        const left = current[i] || 0;
        const right = target[i] || 0;
        if (left > right) return 1;
        if (left < right) return -1;
    }
    return 0;
};

export default ({ onPrev, onNext, form, formData, onFormDataChange }) => {

    const [checkLoading, setCheckLoading] = useState(false);
    const [checkResult, setCheckResult] = useState({ success: undefined });
    const [hasStarted, setHasStarted] = useState(false);

    const handlePrev = () => {
        const resetValues = {
            // password: undefined,
            bootstrap_password: undefined,
            bootstrap_password_confirm: undefined,
            credential_secret: undefined,
            skip: false,
        }
        onFormDataChange(resetValues)
        form.setFieldsValue(resetValues, () => {
            onPrev()
        })
    }

    const onCheck = async () => {
        try {
            setCheckLoading(true);
            const { hosts, isTLS, isAuth, username, password } = formData;
            const host = hosts[0];
            const cluster = {
                endpoint: isTLS ? `https://${host}` : `http://${host}`,
                hosts: hosts,
                schema: isTLS ? "https": "http",
            }
            if (isAuth) {
                cluster.username = username
                cluster.password = password
            }
            const res = await request('/setup/_validate', {
                method: "POST",
                body: {
                    cluster
                },
            }, undefined, false)
            if (res?.success) {
                setCheckResult({ success: true })
                onFormDataChange({ isInit: true})
            } else {
                setCheckResult({ success: false, reason: res?.error?.reason, type: res?.type, shellTips: res?.fix_tips })
                onFormDataChange({ isInit: false})
            }
            setCheckLoading(false);
        } catch (error) {
            console.log(error);
            setCheckResult({ success: false, reason: 'api exception' })
            onFormDataChange({ isInit: false})
            setCheckLoading(false);
        }
    }

    useEffect(() => {
        onCheck()
    }, [])

    const recommendedPrimaryShards = getRecommendedPrimaryShards(formData);
    const rollupSupported = formData.distribution === "easysearch" && compareVersions(formData.version, "1.12.1") >= 0;
    const initialTasks = [
        {
            name: "template_ilm",
            desc: formatMessage({ id: "guide.initialization.task.template_ilm" }),
        },
        ...(rollupSupported && formData.enable_rollup !== false
            ? [{
                name: "rollup",
                desc: formatMessage({ id: "guide.initialization.task.rollup" }),
            }]
            : []),
        {
            name: "insight",
            desc: formatMessage({ id: "guide.initialization.task.insight" }),
        },
        {
            name: "alerting",
            desc: formatMessage({ id: "guide.initialization.task.alerting" }),
        },
        {
            name: "agent",
            desc: formatMessage({ id: "guide.initialization.task.agent" }),
        },
        {
            name: "view",
            desc: formatMessage({ id: "guide.initialization.task.view" }),
        },
    ];

    useEffect(() => {
        if (!checkResult.success) {
            return;
        }
        const nextValues = {};
        if (!formData.primary_shards) {
            nextValues.primary_shards = recommendedPrimaryShards;
        }
        if (!formData.auto_expand_replicas) {
            nextValues.auto_expand_replicas = defaultAutoExpandReplicas;
        }
        if (rollupSupported && typeof formData.enable_rollup === "undefined") {
            nextValues.enable_rollup = defaultEnableRollup;
        }
        if (Object.keys(nextValues).length > 0) {
            onFormDataChange(nextValues);
        }
    }, [checkResult.success, formData.primary_shards, formData.auto_expand_replicas, formData.enable_rollup, recommendedPrimaryShards, rollupSupported]);

    const onSkipClick = () => {
        onFormDataChange({ ...formData, skip: true})
        onNext();
    }

    const [taskState, setTaskState] = useState({
        currentIndex: 1,
        status: "pending",
        logs: [],
    });
    const runTask = async ()=>{
        if(taskState.currentIndex > initialTasks.length){
            return
        }
        const currentTask = initialTasks[taskState.currentIndex - 1];
        setTaskState(st=>{
            st.logs.push(formatMessage({ id: "guide.initialization.task.start" }, { task: currentTask.desc }))
            return {
                ...st,
                status: "running",
            }
        })
        const {
            hosts,
            isTLS,
            isAuth,
            username,
            password,
          } = formData;
        const host = hosts[0];
          const cluster = {
            endpoint: isTLS ? `https://${host}` : `http://${host}`,
              hosts: hosts,
              schema: isTLS ? "https": "http"
          };
          if (isAuth) {
            cluster.username = username;
            cluster.password = password;
           }
           const body = {
             cluster,
             initialize_template: currentTask.name,
             primary_shards: formData.primary_shards,
             auto_expand_replicas: formData.auto_expand_replicas,
           }
        const res = await request(
        "/setup/_initialize_template",
        {
            method: "POST",
            body,
        },
        undefined,
        false
        );
        if(typeof res?.success !== "undefined"){
            setTaskState(st=>{
                if(res?.success === true){
                    st.logs.push(formatMessage({ id: "guide.initialization.task.success" }, { task: currentTask.desc }));
                } else {
                    st.logs.push(formatMessage({ id: "guide.initialization.task.failed" }, { task: currentTask.desc, reason: res?.log || "" }));
                }
                if(res?.success === true){
                    st.currentIndex = st.currentIndex +1;
                }
                return {
                    ...st,
                    status: res?.success === true ? "success" : "failed",
                }
            });
        }
    }
    useEffect(()=>{
        if(!checkResult.success || !hasStarted){
            return
        }
        runTask();
    },[taskState.currentIndex, checkResult.success, hasStarted])

    const startInitialization = () => {
        if (!Number.isInteger(formData.primary_shards) || formData.primary_shards < 1) {
            message.error(formatMessage({ id: "guide.initialization.primary_shards.invalid" }));
            return;
        }
        const autoExpandReplicas = (formData.auto_expand_replicas || defaultAutoExpandReplicas).trim();
        if (!isValidAutoExpandReplicas(autoExpandReplicas)) {
            message.error(formatMessage({ id: "guide.initialization.auto_expand_replicas.invalid" }));
            return;
        }
        onFormDataChange({
            auto_expand_replicas: autoExpandReplicas,
            enable_rollup: rollupSupported ? formData.enable_rollup !== false : false,
        });
        setHasStarted(true);
    }

    const retryTask = ()=>{
        runTask();
    }
    const skipTask = ()=>{
        setTaskState(st=>{
            return {
                ...st,
                currentIndex: st.currentIndex + 1
            }
        })
    }

    const currentIndex = taskState.currentIndex > initialTasks.length ? initialTasks.length-1: taskState.currentIndex-1;

    return (
        <Spin spinning={checkLoading}>
            <div className={styles.initialization}>
                {
                    checkResult.success ? (
                        <div style={{width:"80%", margin:"0 auto"}}>
                            {!hasStarted ? (
                                <>
                                    <Alert
                                        showIcon
                                        type="info"
                                        style={{ marginBottom: 16 }}
                                        message={formatMessage(
                                            { id: "guide.initialization.defaults.message" },
                                            {
                                                dataNodes: formData.number_of_data_nodes || formData.number_of_nodes || 0,
                                                totalNodes: formData.number_of_nodes || 0,
                                                primaryShards: recommendedPrimaryShards,
                                            }
                                        )}
                                    />
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ marginBottom: 8, fontWeight: 500 }}>
                                            {formatMessage({ id: "guide.initialization.primary_shards" })}
                                        </div>
                                        <InputNumber
                                            min={1}
                                            precision={0}
                                            style={{ width: "100%" }}
                                            value={formData.primary_shards}
                                            onChange={(value) => onFormDataChange({ primary_shards: value })}
                                        />
                                        <div style={{ marginTop: 8, color: "rgba(0,0,0,.45)" }}>
                                            {formatMessage({ id: "guide.initialization.primary_shards.help" })}
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ marginBottom: 8, fontWeight: 500 }}>
                                            {formatMessage({ id: "guide.initialization.auto_expand_replicas" })}
                                        </div>
                                        <Input
                                            value={formData.auto_expand_replicas}
                                            onChange={(event) => onFormDataChange({ auto_expand_replicas: event.target.value })}
                                        />
                                    <div style={{ marginTop: 8, color: "rgba(0,0,0,.45)" }}>
                                            {formatMessage({ id: "guide.initialization.auto_expand_replicas.help" })}
                                        </div>
                                    </div>
                                    {rollupSupported ? (
                                        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                                            <Switch
                                                checked={formData.enable_rollup !== false}
                                                onChange={(checked) => onFormDataChange({ enable_rollup: checked })}
                                            />
                                            <div>
                                                <div style={{ fontWeight: 500 }}>
                                                    {formatMessage({ id: "guide.initialization.rollup" })}
                                                </div>
                                                <div style={{ marginTop: 4, color: "rgba(0,0,0,.45)" }}>
                                                    {formatMessage({ id: "guide.initialization.rollup.help" })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                    <div style={{ display: "flex", justifyContent: "space-between", width:"60%", margin:"15px auto 0 auto" }}>
                                        <Button
                                            style={{ width: "48%" }}
                                            type="primary"
                                            onClick={handlePrev}
                                        >
                                            {formatMessage({ id: "guide.step.prev" })}
                                        </Button>
                                        <Button
                                            style={{ width: "48%" }}
                                            type="primary"
                                            onClick={startInitialization}
                                        >
                                            {formatMessage({ id: "guide.initialization.start" })}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                            <div style={{display:"flex"}}>
                                <div>
                                [{currentIndex+1}/{initialTasks.length}]
                                {taskState.status === "running" ? <Icon type="loading" style={{color:"rgb(2, 127, 254)", marginLeft:5}}/>: null}
                                {taskState.status === "failed" ? <Icon type="close-circle" style={{color:"rgb(219, 0, 0)", marginLeft:5}} theme="filled"/>: null}
                                <span style={{marginLeft:5}}>{initialTasks[currentIndex].desc}</span>
                                </div>
                                {taskState.status === "failed" ?
                                 <div style={{marginLeft:"auto"}}>
                                    <a onClick={retryTask} key="retry">Retry</a><Divider type="vertical" /><a onClick={skipTask} key="skip">Skip</a>
                                 </div>: null}
                            </div>
                            <div style={{background:"rgb(16, 16, 16)", color:"#fff", height:214, marginTop:5, borderRadius:5,padding:5, overflow:"scroll"}}>
                                {taskState.logs.map(item=><div>{item}</div>)}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", width:"60%", margin:"15px auto 0 auto" }}>
                                <Button
                                style={{ width: "48%" }}
                                type="primary"
                                disabled={taskState.status === "running"}
                                onClick={handlePrev}
                                >
                                {formatMessage({ id: "guide.step.prev" })}
                                </Button>
                                <Button style={{ width: "48%" }} type="primary" disabled={taskState.status === "running"} onClick={onNext}>
                                {formatMessage({ id: "guide.step.next" })}
                                </Button>
                            </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <Result
                            icon={<Icon className={styles.warning} type="info-circle" theme="filled" />}
                            title={(
                                <span className={styles.title}>
                                    <Tooltip title={checkResult?.reason}>
                                        { formatMessage({ id: `guide.cluster.validate.${checkResult?.type || 'default'}`}) }
                                    </Tooltip>
                                    <a style={{ marginLeft: 12 }} onClick={onCheck}>
                                        <Icon type="reload" style={{ marginRight: 4 }}/>
                                        { formatMessage({ id: 'guide.step.refresh' }) }
                                    </a>
                                </span>
                            )}
                            subTitle={(
                                <div>
                                    <div>{ formatMessage({ id: 'guide.cluster.validate.sub' }) }</div>
                                    <div><strong style={{color:"rgb(255, 0, 0)"}}>{ formatMessage({ id: 'guide.cluster.validate.sub.strong' }) }</strong></div>
                                </div>
                            )}
                            extra={[
                                <Button type="primary" key="previous" onClick={handlePrev}>{ formatMessage({ id: 'guide.step.prev' }) }</Button>,
                                <Button type="primary" key="skip" onClick={onSkipClick}>{ formatMessage({ id: 'guide.cluster.skip' }) }</Button>,
                            ]}
                        >
                            {
                                checkResult?.shellTips && (
                                    <div className={styles.shell}>
                                        {
                                            (checkResult?.shellTips || '').split('\n').map((item, index) => (
                                                <p key={index}>{item.trim()}</p>
                                            ))
                                        }
                                        <CopyToClipboard text={checkResult?.shellTips}>
                                            <Icon type="copy" className={styles.copy} onClick={
                                                () => message.success(formatMessage({ id: 'guide.shell.copy' }))
                                            }/>
                                        </CopyToClipboard>
                                    </div>
                                )
                            }
                            <div className={styles.skipDesc}>
                                {formatMessage({ id: 'guide.cluster.skip.desc' })}
                            </div>
                        </Result>
                    )
                }
                
            </div>
        </Spin>
        
    )
}
