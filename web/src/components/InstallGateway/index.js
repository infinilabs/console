import { Alert, Button, Icon, message, Select, Spin, Switch, Tooltip } from "antd";
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

const advancedWrapStyle = {
  marginBottom: 16,
  textAlign: "left",
};

const advancedToggleStyle = {
  padding: 0,
  height: "auto",
  color: "rgba(0, 0, 0, 0.65)",
  fontSize: 12,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const toggleRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  columnGap: 24,
  rowGap: 12,
  marginTop: 8,
};

const toggleItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const toggleLabelStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

const infoIconStyle = {
  color: "rgba(0, 0, 0, 0.45)",
  fontSize: 12,
  cursor: "pointer",
};

const noServiceAlertStyle = {
  marginBottom: 16,
  textAlign: "left",
};

const noServiceContentStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const noServiceCodeTitleStyle = {
  fontWeight: 500,
  color: "#101010",
};

const noServiceCodeStyle = {
  display: "block",
  padding: "8px 10px",
  borderRadius: 4,
  background: "#f5f5f5",
  color: "#434343",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontFamily:
    '"SFMono-Regular", Monaco, Menlo, Consolas, "Liberation Mono", "Ubuntu Mono", monospace',
};

export default ({ autoInit = false }) => {
  const { Option } = Select;
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState();
  const [noService, setNoService] = useState(false);
  const [gatewayType, setGatewayType] = useState("migration");
  const [advancedVisible, setAdvancedVisible] = useState(false);

  const fetchTokenInfo = async (
    noServiceEnabled = noService,
    gatewayTypeValue = gatewayType
  ) => {
    setTokenInfo(undefined);
    setLoading(true);
    const res = await request("/instance/_generate_gateway_install_script", {
      method: "POST",
      body: {
        no_service: noServiceEnabled,
        gateway_type: gatewayTypeValue,
      },
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
        <Button type="primary" onClick={() => fetchTokenInfo()} style={{ marginBottom: 20 }}>
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
          <div style={advancedWrapStyle}>
            <Button
              type="link"
              style={advancedToggleStyle}
              onClick={() => setAdvancedVisible((visible) => !visible)}
            >
              {formatMessage({ id: "gateway.install.advanced.title" })}
              <Icon type={advancedVisible ? "up" : "down"} />
            </Button>
            {advancedVisible ? (
              <div style={toggleRowStyle}>
                <div style={toggleItemStyle}>
                  <span style={toggleLabelStyle}>
                    <span>{formatMessage({ id: "gateway.install.type.label" })}</span>
                  </span>
                  <Select
                    value={gatewayType}
                    style={{ width: 220 }}
                    onChange={(value) => {
                      setGatewayType(value);
                      if (autoInit || tokenInfo) {
                        fetchTokenInfo(noService, value);
                      }
                    }}
                  >
                    <Option value="migration">
                      {formatMessage({ id: "gateway.install.type.migration" })}
                    </Option>
                    <Option value="relay">
                      {formatMessage({ id: "gateway.install.type.relay" })}
                    </Option>
                  </Select>
                </div>
                <div style={toggleItemStyle}>
                  <span style={toggleLabelStyle}>
                    <span>{formatMessage({ id: "gateway.install.no_sudo.label" })}</span>
                    <Tooltip title={formatMessage({ id: "gateway.install.no_sudo.help" })}>
                      <Icon type="info-circle" style={infoIconStyle} />
                    </Tooltip>
                  </span>
                  <Switch
                    checked={noService}
                    onChange={(checked) => {
                      setNoService(checked);
                      if (autoInit || tokenInfo) {
                        fetchTokenInfo(checked);
                      }
                    }}
                  />
                </div>
              </div>
            ) : null}
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
                  message.success(formatMessage({ id: "gateway.guide.shell.copy.success" }))
                }
              />
            </CopyToClipboard>
          </div>
          {noService ? (
            <Alert
              style={noServiceAlertStyle}
              type="info"
              showIcon
              message={formatMessage({ id: "gateway.install.no_sudo.tip.title" })}
              description={
                <div style={noServiceContentStyle}>
                  <div>{formatMessage({ id: "gateway.install.no_sudo.tip.desc" })}</div>
                  <div style={noServiceCodeTitleStyle}>
                    {formatMessage({ id: "gateway.install.no_sudo.command.title" })}
                  </div>
                  <code style={noServiceCodeStyle}>
                    cd /path/to/gateway && ./gateway-* -config gateway.yml
                  </code>
                </div>
              }
            />
          ) : null}
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
            {noService ? (
              <p>
                · {formatMessage({ id: "gateway.install.no_sudo.help_line" })}{" "}
                <code>--no-service</code>
              </p>
            ) : null}
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
