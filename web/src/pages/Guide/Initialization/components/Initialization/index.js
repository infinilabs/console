import { useEffect, useState } from 'react';
import { Button, Form, Icon, Input, message, Result, Spin, Tooltip ,Divider} from 'antd';
import styles from './index.less'
import request from '@/utils/request';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { formatMessage } from "umi/locale";


const errorReason = {
    'elasticsearch_version_too_old': 'Cluster version is too old',
    'elasticsearch_indices_exists': 'Some related indices are already exists in the target cluster',
    'elasticsearch_template_exists': 'Some related templates are already exists in the target cluster',
    'default': 'Cluster version is too old or something are already exists in the target cluster'
}

const initialTasks = [{
    name: "template_ilm",
    desc: "Initialize template and ilm"
},{
    name: "rollup",
    desc: "Initialize rollup template"
},{
    name: "insight",
    desc: "Initialize dashboard template and chart template"
},{
    name: "alerting",
    desc: "Initialize bulitin alerting rule and channel"
},{
    name: "agent",
    desc: "Initialize agent setup template"
},{
    name: "view",
    desc: "Initialize data view template"
}];
export default ({ onPrev, onNext, form, formData, onFormDataChange }) => {

    const [checkLoading, setCheckLoading] = useState(false);
    const [checkResult, setCheckResult] = useState({ success: undefined });

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
        setTaskState(st=>{
            st.logs.push(`start to initialize template [${initialTasks[taskState.currentIndex-1].name}]`)
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
            initialize_template: initialTasks[taskState.currentIndex-1].name,
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
                st.logs.push(res.log);
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
        if(!checkResult.success){
            return
        }
        runTask();
    },[taskState.currentIndex, checkResult.success])

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