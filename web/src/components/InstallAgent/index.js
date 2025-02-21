import { Form, Select, Spin, Icon, message, Button } from "antd";
import styles from "./index.less";
import useFetch from "@/lib/hooks/use_fetch";
import { useEffect, useMemo, useState } from "react";
import request from "@/utils/request";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { formatMessage } from "umi/locale"; 
import { getDocPathByLang, getWebsitePathByLang } from "@/utils/utils";

export default ({autoInit = false}) => {

    const [tokenLoading, setTokenLoading] = useState(false);

    const [seletedGateways, setSeletedGateways] = useState([]);

    const [tokenInfo, setTokenInfo] = useState();

    const fetchTokenInfo = async () => {
        setTokenInfo()
        setTokenLoading(true)
        const res = await request('/instance/_generate_install_script', {
            method: "POST",
            body: {
                gateway_endpoints: seletedGateways
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
                            <div className={styles.content}>
                                {tokenInfo.script}
                                <CopyToClipboard text={tokenInfo.script}>
                                    <Icon 
                                        type="copy" 
                                        className={styles.copy} 
                                        onClick={
                                            () => message.success(formatMessage({
                                                id: "agent.install.setup.copy.success"
                                            }))
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
                                    {/* <p>
                                        · 支持的自定义变量如下，均为可选参数, 多个环境变量之间以空格分割:
                                    </p>
                                    <div className={styles.children}>
                                        <p>
                                            BASE_URL:  Agent安装包的下载地址，如: https://release.infinilabs.com/agent/stable
                                        </p>
                                        <p>
                                            AGENT_VER:  Agent版本号，如: 0.4.0-126
                                        </p>
                                        <p>
                                            INSTALL_PATH:  Agent安装目录, 如: /opt
                                        </p>
                                    </div> */}
                                    <p>
                                        ·  {formatMessage({
                                                id:"agent.install.tips.desc"
                                            })}
                                        <a href={`${getDocPathByLang()}/reference/agent/install/`} target="_blank">{formatMessage({
                                                id:"agent.install.link.manual_install"
                                            })}&gt;</a>
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
