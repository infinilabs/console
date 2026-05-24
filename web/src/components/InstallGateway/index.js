import { Button, Icon, message, Spin } from "antd";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useEffect, useState } from "react";
import { formatMessage } from "umi/locale";

import request from "@/utils/request";
import { getDocPathByLang } from "@/utils/utils";

const shellContainerStyle = {
  borderRadius: 5,
  fontSize: 14,
  padding: "12px 36px 12px 12px",
  background: "rgb(241, 242, 245)",
  position: "relative",
  textAlign: "left",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontFamily:
    '"SFMono-Regular", Monaco, Menlo, Consolas, "Liberation Mono", "Ubuntu Mono", monospace',
  marginBottom: 24,
};

const intranetNoticeStyle = {
  background: "#f6ffed",
  border: "1px solid #b7eb8f",
  borderRadius: 6,
  padding: "10px 12px",
  marginBottom: 16,
  color: "#565656",
  fontSize: 12,
  lineHeight: 1.8,
};

export default ({ autoInit = false }) => {
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState();

  const fetchTokenInfo = async () => {
    setTokenInfo(undefined);
    setLoading(true);
    const res = await request("/instance/_generate_gateway_install_script", {
      method: "POST",
    });
    setTokenInfo(res);
    setLoading(false);
  };

  useEffect(() => {
    if (autoInit) {
      fetchTokenInfo();
    }
  }, []);

  return (
    <Spin spinning={loading}>
      {!autoInit && (
        <Button type="primary" onClick={fetchTokenInfo} style={{ marginBottom: 20 }}>
          {formatMessage({ id: "gateway.install.label.get_cmd" })}
        </Button>
      )}
      {tokenInfo && (
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            {formatMessage({ id: "gateway.guide.quick_install" })}
          </div>
          <div style={{ color: "#565656", marginBottom: 10 }}>
            {formatMessage({ id: "gateway.guide.quick_install.desc" })}
          </div>
            <div style={intranetNoticeStyle}>
              <div style={{ color: "#101010", fontWeight: 500, marginBottom: 4 }}>
                {formatMessage({ id: "gateway.guide.intranet.title" })}
              </div>
              <div>{formatMessage({ id: "gateway.guide.intranet.desc" })}</div>
            </div>
          <div style={shellContainerStyle}>
            {tokenInfo.script}
            <CopyToClipboard text={tokenInfo.script}>
              <Icon
                type="copy"
                style={{
                  color: "#007fff",
                  cursor: "pointer",
                  position: "absolute",
                  top: 8,
                  right: 8,
                }}
                onClick={() =>
                  message.success(
                    formatMessage({ id: "gateway.guide.shell.copy.success" })
                  )
                }
              />
            </CopyToClipboard>
          </div>
          <div style={{ fontSize: 12, color: "#565656" }}>
            <div style={{ fontWeight: 400, color: "#101010", marginBottom: 8 }}>
              {formatMessage({ id: "gateway.guide.tips.title" })}
            </div>
            <p>
              · {formatMessage({ id: "gateway.guide.tips.version" })}{" "}
              <code>-v 1.30.3-2407</code>
            </p>
            <p>
              · {formatMessage({ id: "gateway.guide.tips.directory" })}{" "}
              <code>-d /opt/gateway</code>
            </p>
            <p>
              · {formatMessage({ id: "gateway.guide.tips.download_source" })}{" "}
              <code>-u http://192.168.1.1:8080</code>
            </p>
            <p>
              · {formatMessage({ id: "gateway.guide.tips.content" })}{" "}
              <a
                href={`${getDocPathByLang("gateway")}/getting-started/install/`}
                target="_blank"
                rel="noreferrer"
              >
                {formatMessage({ id: "gateway.guide.tips.install_manually" })}
              </a>
            </p>
          </div>
        </div>
      )}
    </Spin>
  );
};
