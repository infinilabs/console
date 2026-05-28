import { Form, Select, Spin, Icon, message, Button, Switch, Tooltip } from "antd";
import styles from "./index.less";
import useFetch from "@/lib/hooks/use_fetch";
import { useEffect, useMemo, useState } from "react";
import request from "@/utils/request";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { formatMessage } from "umi/locale"; 
import { getDocPathByLang, getWebsitePathByLang } from "@/utils/utils";

export default ({autoInit = false, centerToggle = false}) => {

    const [tokenLoading, setTokenLoading] = useState(false);
    const [enableReverseChannel, setEnableReverseChannel] = useState(false);

    const [seletedGateways, setSeletedGateways] = useState([]);

    const [tokenInfo, setTokenInfo] = useState();

    const fetchTokenInfo = async (reverseChannelEnabled = enableReverseChannel) => {
        setTokenInfo()
        setTokenLoading(true)
        const res = await request('/instance/_generate_install_script', {
            method: "POST",
            body: {
                gateway_endpoints: seletedGateways,
                enable_reverse_channel: reverseChannelEnabled,
            }
        })
        setTokenInfo(res)
        setTokenLoading(false)
    }
    useEffect(()=>{
        if(autoInit){
            fetchTokenInfo();
        }
    }, [])


    return (
        <Spin spinning={tokenLoading}>
            <div className={styles.installAgent}>
                <div className={`${styles.reverseChannelToggle} ${centerToggle ? styles.reverseChannelToggleCentered : ""}`}>
                <span className={styles.reverseChannelLabel}>
                    <span>{formatMessage({ id: "agent.install.reverse_channel.label" })}</span>
                    <Tooltip title={formatMessage({ id: "agent.install.reverse_channel.help" })}>
                        <Icon type="info-circle" className={styles.reverseChannelInfo} />
                    </Tooltip>
                </span>
                <Switch
                    checked={enableReverseChannel}
                    onChange={(checked) => {
                        setEnableReverseChannel(checked);
                        if (autoInit || tokenInfo) {
                            fetchTokenInfo(checked);
                        }
                        }}
                    />
                </div>
                {!autoInit && <Button  className={styles.gateway} type="primary" onClick={() => fetchTokenInfo()}>
                {formatMessage({
                    id:"agent.install.label.get_cmd"
                })}
                </Button>}
                {
                    tokenInfo && (
                        <div className={styles.shell}>
                            <div className={styles.installtitle}>
                                {formatMessage({
                                    id:"agent.install.setup.title"
                                })}
                            </div>
                            <p className={styles.desc}>
                            {formatMessage({
                                    id:"agent.install.setup.desc"
                                })}：
                            </p>
                            <div style={{
                                background: "#f6ffed",
                                border: "1px solid #b7eb8f",
                                borderRadius: 6,
                                padding: "10px 12px",
                                marginBottom: 16,
                                color: "#565656",
                                fontSize: 12,
                                lineHeight: 1.8,
                             }}>
                                <div style={{ color: "#101010", fontWeight: 500, marginBottom: 4 }}>
                                    {formatMessage({ id: "agent.install.tips.intranet.title" })}
                                </div>
                                <div>{formatMessage({ id: "agent.install.tips.intranet.desc" })}</div>
                            </div>
                            <div className={styles.content}>
                                {tokenInfo.script}
                                <CopyToClipboard text={tokenInfo.script}>
                                    <Icon 
                                        type="copy" 
                                        className={styles.copy} 
                                        onClick={
                                            () => message.open({
                                                type: "success",
                                                key: "agent-install-copy-success",
                                                content: formatMessage({
                                                    id: "agent.install.setup.copy.success"
                                                }),
                                            })
                                        }
                                    />
                                </CopyToClipboard>
                            </div>
                            <div className={styles.help}>
                                <div className={styles.title}> 
                                {formatMessage({
                                    id:"agent.install.tips.title"
                                })}：</div>
                                <div className={styles.content}>
                                     <p>
                                         · {formatMessage({
                                                 id:"agent.install.tips.target"
                                             })} <code>-t /opt/agent</code>
                                     </p>
                                    <p>
                                        · {formatMessage({
                                                id:"agent.install.tips.version"
                                            })} <code>-v 1.30.3-2407</code>
                                    </p>
                                    <p>
                                        · {formatMessage({
                                                id:"agent.install.tips.download"
                                            })} <code>-u http://192.168.1.1:8080</code>
                                    </p>
                                    <p>
                                        · {formatMessage({
                                                id:"agent.install.tips.server"
                                            })} <code>-s http://192.168.1.1:9000</code>
                                    </p>
                                    <p>
                                        ·  {formatMessage({
                                                id:"agent.install.tips.desc"
                                            })}
                                        <a href={`${getDocPathByLang()}/reference/agent/install/`} target="_blank">{formatMessage({
                                                id:"agent.install.link.manual_install"
                                            })}</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </Spin>
  );
};
