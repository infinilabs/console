import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import {
  Alert,
  Button,
  Card,
  Empty,
  InputNumber,
  Spin,
  Switch,
  Tabs,
  message,
} from "antd";
import { formatMessage } from "umi/locale";
import router from "umi/router";
import { useEffect, useMemo, useState } from "react";
import request from "@/utils/request";
import ServerList from "../Email/Server";
import { hasAuthority, refreshApplicationSettings } from "@/utils/authority";

const { TabPane } = Tabs;

const SystemSettings = (props) => {
  const query = new URLSearchParams(props.location?.search || "");
  const pathDefaultTab = props.location?.pathname?.includes("/email_server")
    ? "email"
    : "general";
  const canReadCluster =
    hasAuthority("system.cluster:all") || hasAuthority("system.cluster:read");
  const canWriteCluster = hasAuthority("system.cluster:all");
  const canReadEmail =
    hasAuthority("system.smtp_server:all") ||
    hasAuthority("system.smtp_server:read");
  const tabs = useMemo(() => {
    const nextTabs = [];
    if (canReadCluster) {
      nextTabs.push("general");
    }
    if (canReadEmail) {
      nextTabs.push("email");
    }
    return nextTabs;
  }, [canReadCluster, canReadEmail]);
  const [activeTab, setActiveTab] = useState(
    query.get("tab") || pathDefaultTab || tabs[0] || "general"
  );
  const defaultRetentionMaxSize = 50;
  const [retentionDays, setRetentionDays] = useState(30);
  const [retentionDraftDays, setRetentionDraftDays] = useState(30);
  const [retentionMaxSize, setRetentionMaxSize] = useState(defaultRetentionMaxSize);
  const [retentionDraftMaxSize, setRetentionDraftMaxSize] = useState(
    defaultRetentionMaxSize
  );
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [rollupEnabled, setRollupEnabled] = useState(false);
  const [rollupLoading, setRollupLoading] = useState(false);

  const normalizeRetentionSize = (value) =>
    `${value || ""}`.replace(/\s+/g, "").toLowerCase();

  const parseRetentionSizeToGb = (value) => {
    const normalizedValue = normalizeRetentionSize(value);
    const matches = normalizedValue.match(/^(\d+)(b|kb|mb|gb|tb|k|m|g|t)$/i);
    if (!matches) {
      return defaultRetentionMaxSize;
    }
    const size = Number(matches[1]);
    const unit = matches[2].toLowerCase();
    const multiplier = {
      b: 1 / 1024 / 1024 / 1024,
      kb: 1 / 1024 / 1024,
      k: 1 / 1024 / 1024,
      mb: 1 / 1024,
      m: 1 / 1024,
      gb: 1,
      g: 1,
      tb: 1024,
      t: 1024,
    }[unit];
    if (!multiplier) {
      return defaultRetentionMaxSize;
    }
    return Math.max(1, Math.ceil(size * multiplier));
  };

  const isValidRetentionSize = (value) =>
    Number.isInteger(value) && value > 0;

  useEffect(() => {
    if (tabs.length > 0 && !tabs.includes(activeTab)) {
      setActiveTab(tabs[0]);
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    if (!canReadCluster) {
      return;
    }
    const fetchRetentionSetting = async () => {
      setRetentionLoading(true);
      const res = await request("/setting/system/retention", {
        method: "GET",
      });
      if (!res?.error && Number.isInteger(res.days) && res.days > 0) {
        setRetentionDays(res.days);
        setRetentionDraftDays(res.days);
        if (res.max_size) {
          const normalizedSize = parseRetentionSizeToGb(res.max_size);
          setRetentionMaxSize(normalizedSize);
          setRetentionDraftMaxSize(normalizedSize);
        }
      }
      setRetentionLoading(false);
    };
    const fetchRollupSetting = async () => {
      setRollupLoading(true);
      const res = await request("/setting/system/rollup", {
        method: "GET",
      });
      if (!res?.error) {
        setRollupEnabled(!!res.enabled);
      }
      setRollupLoading(false);
    };
    fetchRetentionSetting();
    fetchRollupSetting();
  }, [canReadCluster]);

  const onTabChange = (key) => {
    setActiveTab(key);
    router.replace(`/system/settings?tab=${key}`);
  };

  const onRollupToggle = async (checked) => {
    const previousValue = rollupEnabled;
    setRollupEnabled(checked);
    setRollupLoading(true);
    const res = await request("/setting/system/rollup", {
      method: "PUT",
      body: {
        enabled: checked,
      },
    });
    if (res?.error) {
      setRollupEnabled(previousValue);
      setRollupLoading(false);
      return;
    }
    await refreshApplicationSettings(true);
    setRollupLoading(false);
    message.success(
      formatMessage({ id: "settings.system.rollup.update.success" })
    );
  };

  const onRetentionSave = async () => {
    if (!Number.isInteger(retentionDraftDays) || retentionDraftDays <= 0) {
      message.warning(
        formatMessage({ id: "settings.system.retention.validation.days" })
      );
      return;
    }
    if (!isValidRetentionSize(retentionDraftMaxSize)) {
      message.warning(
        formatMessage({ id: "settings.system.retention.validation.max_size" })
      );
      return;
    }
    setRetentionLoading(true);
    const normalizedMaxSize = normalizeRetentionSize(`${retentionDraftMaxSize}gb`);
    const res = await request("/setting/system/retention", {
      method: "PUT",
      body: {
        days: retentionDraftDays,
        max_size: normalizedMaxSize,
      },
    });
    if (res?.error) {
      setRetentionLoading(false);
      return;
    }
    setRetentionDays(res.days);
    setRetentionDraftDays(res.days);
    setRetentionMaxSize(parseRetentionSizeToGb(res.max_size || normalizedMaxSize));
    setRetentionDraftMaxSize(
      parseRetentionSizeToGb(res.max_size || normalizedMaxSize)
    );
    setRetentionLoading(false);
    message.success(
      formatMessage({ id: "settings.system.retention.update.success" })
    );
  };

  const renderRetentionSettings = () => {
    if (!canReadCluster) {
      return null;
    }
    return (
      <Spin spinning={retentionLoading}>
        <Card bordered={false} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                {formatMessage({ id: "settings.system.retention.title" })}
              </div>
              <div style={{ color: "rgba(0,0,0,0.65)", marginBottom: 16 }}>
                {formatMessage({
                  id: "settings.system.retention.description",
                })}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginLeft: 16,
              }}
            >
              <InputNumber
                min={1}
                precision={0}
                value={retentionDraftDays}
                disabled={!canWriteCluster || retentionLoading}
                onChange={(value) => {
                  setRetentionDraftDays(
                    Number.isInteger(value) ? value : retentionDraftDays
                  );
                }}
              />
              <span>{formatMessage({ id: "settings.system.retention.unit" })}</span>
              <span style={{ marginLeft: 8 }}>
                {formatMessage({ id: "settings.system.retention.size.label" })}
              </span>
              <InputNumber
                min={1}
                precision={0}
                style={{ width: 120 }}
                value={retentionDraftMaxSize}
                disabled={!canWriteCluster || retentionLoading}
                placeholder="50"
                onChange={(value) => {
                  setRetentionDraftMaxSize(
                    Number.isInteger(value) ? value : retentionDraftMaxSize
                  );
                }}
              />
              <span>{formatMessage({ id: "settings.system.retention.size.unit" })}</span>
              <Button
                type="primary"
                loading={retentionLoading}
                disabled={
                  !canWriteCluster ||
                  !Number.isInteger(retentionDraftDays) ||
                  retentionDraftDays <= 0 ||
                  !isValidRetentionSize(retentionDraftMaxSize) ||
                  (retentionDraftDays === retentionDays &&
                    retentionDraftMaxSize === retentionMaxSize)
                }
                onClick={onRetentionSave}
              >
                {formatMessage({ id: "settings.system.retention.save" })}
              </Button>
            </div>
          </div>
          <Alert
            type="info"
            showIcon
            message={<div>{formatMessage({ id: "settings.system.retention.help" })}</div>}
          />
        </Card>
      </Spin>
    );
  };

  const renderRollupSettings = () => {
    if (!canReadCluster) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="" />;
    }
    return (
      <Spin spinning={rollupLoading}>
        <Card bordered={false}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                {formatMessage({ id: "settings.system.rollup.title" })}
              </div>
              <div style={{ color: "rgba(0,0,0,0.65)", marginBottom: 16 }}>
                {formatMessage({ id: "settings.system.rollup.description" })}
              </div>
            </div>
            <Switch
              checked={rollupEnabled}
              loading={rollupLoading}
              disabled={!canWriteCluster}
              checkedChildren={formatMessage({
                id: "settings.system.rollup.enabled",
              })}
              unCheckedChildren={formatMessage({
                id: "settings.system.rollup.disabled",
              })}
              onChange={onRollupToggle}
            />
          </div>
          <Alert
            type="info"
            showIcon
            message={formatMessage({ id: "settings.system.rollup.help" })}
          />
        </Card>
      </Spin>
    );
  };

  const renderGeneralSettings = () => {
    if (!canReadCluster) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description=""/>;
    }
    return (
      <>
        {renderRetentionSettings()}
        {renderRollupSettings()}
      </>
    );
  };

  return (
    <PageHeaderWrapper>
      <Card>
        <Tabs activeKey={activeTab} onChange={onTabChange}>
          {canReadCluster ? (
            <TabPane
              tab={formatMessage({ id: "settings.system.tab.general" })}
              key="general"
            >
              {renderGeneralSettings()}
            </TabPane>
          ) : null}
          {canReadEmail ? (
            <TabPane
              tab={formatMessage({ id: "settings.system.tab.email" })}
              key="email"
            >
              <ServerList embedded />
            </TabPane>
          ) : null}
        </Tabs>
      </Card>
    </PageHeaderWrapper>
  );
};

export default SystemSettings;
