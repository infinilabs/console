import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import { Tabs, Modal } from "antd";
import styles from "./index.less";
import Version from "./Version";
import Tips from "./Tips";
import Licence from "./Licence";
import moment from "moment";
import { formatMessage } from "umi/locale";

export const DATE_FORMAT = "YYYY.MM.DD HH:mm";

export const LICENCE_ROUTES = ["/data_tools", "/alerting/channel"];
export const LICENCE_NOOPEN_ROUTES = ["/", "/overview"];

export const FEATURES = [
  { name: formatMessage({ id: "license.feature.multi_cluster_access" }) },
  { name: formatMessage({ id: "license.feature.multi_cluster_manage" }) },
  { name: formatMessage({ id: "license.feature.log_audit" }) },
  { name: formatMessage({ id: "license.feature.query_analysis" }) },
  { name: formatMessage({ id: "license.feature.visual_analysis" }) },
  { name: formatMessage({ id: "license.feature.platform_monitoring" }) },
  { name: formatMessage({ id: "license.feature.identity_control" }) },
  {
    name: formatMessage({ id: "license.feature.alarm_notification" }),
    route: "/alerting",
  },
  {
    name: formatMessage({ id: "license.feature.data_migration" }),
    route: "/data_tools",
  },
  {
    name: formatMessage({ id: "license.feature.data_backup" }),
    route: "/data_tools",
  },
  {
    name: formatMessage({ id: "license.feature.data_disaster_recovery" }),
    route: "/data_tools",
  },
];

export const checkLicenceType = (licenceType, expireAt, isProEdition) => {
  if (isProEdition) {
    if (
      !licenceType ||
      licenceType === "UnLicensed" ||
      licenceType === "Free" ||
      !expireAt
    )
      return false;
  } else {
    if (!licenceType || licenceType === "UnLicensed" || !expireAt) return false;
  }

  if (moment(expireAt).diff(moment(), "seconds") > 0) return true;
  return false;
};

const tabs = [
  {
    key: "version",
    title: formatMessage({ id: "license.tab.version.title" }),
    component: Version,
  },
  {
    key: "tips",
    title: formatMessage({ id: "license.tab.tips.title" }),
    component: Tips,
  },
  {
    key: "licence",
    title: formatMessage({ id: "license.tab.license.title" }),
    component: Licence,
  },
];

export default forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [isTips, setIsTips] = useState(false);
  const triggerTimeRef = useRef(null);
  const tabRef = useRef(null);

  const {
    location: { pathname },
    licence: { license_type, expire_at, loading },
  } = props;

  useImperativeHandle(ref, () => ({
    open: onOpen,
    close: onClose,
  }));

  const onOpen = (isTips) => {
    const isFirstLogin = localStorage.getItem("first-login");
    if (isFirstLogin !== "true") {
      setIsTips(isTips);
      setVisible(true);
    }
  };

  const onClose = () => {
    setIsTips();
    setVisible();
    if (tabRef.current.resetCode) tabRef.current.resetCode();
  };

  const checkRoutes = (license_type, expire_at, is_pro) => {
    if (checkLicenceType(license_type, expire_at, is_pro)) {
      return;
    }
    if (triggerTimeRef.current) {
      const now = moment();
      if (now.diff(triggerTimeRef.current, "seconds") > 60) {
        //未授权时每1分钟弹窗提示
        onOpen(true);
        triggerTimeRef.current = now;
      }
    } else {
      onOpen(true);
      triggerTimeRef.current = moment();
    }
  };

  useEffect(() => {
    if (loading) {
      return;
    }

    //home overview do not open license window
    if (LICENCE_NOOPEN_ROUTES.includes(props.location.pathname)) {
      return;
    }
    if (LICENCE_ROUTES.some((item) => props.location.pathname.includes(item))) {
      //pro Edition
      checkRoutes(license_type, expire_at, true);
    } else {
      //all routes check（except pro Edition)
      checkRoutes(license_type, expire_at);
    }
  }, [pathname, license_type, expire_at, loading]);

  const formatTabs = useMemo(() => {
    return tabs.filter((item) => {
      if (isTips && item.key === "version") return false;
      if (!isTips && item.key === "tips") return false;
      return true;
    });
  }, [isTips]);

  return (
    <Modal
      visible={visible}
      wrapClassName={styles.systemLicence}
      closable
      footer={null}
      onCancel={onClose}
      destroyOnClose
      width={560}
    >
      <Tabs defaultActiveKey="version">
        {formatTabs.map((item) => (
          <Tabs.TabPane tab={item.title} key={item.key}>
            <div className={styles.content}>
              {item.component({ ...props, onClose }, tabRef)}
            </div>
          </Tabs.TabPane>
        ))}
      </Tabs>
    </Modal>
  );
});
