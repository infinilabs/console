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
import moment from "moment";
import { formatMessage } from "umi/locale";

export const DATE_FORMAT = "YYYY.MM.DD HH:mm";

const tabs = [
  {
    key: "version",
    title: formatMessage({ id: "license.tab.version.title" }),
    component: Version,
  },
];

export default forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const triggerTimeRef = useRef(null);
  const tabRef = useRef(null);

  const {
    location: { pathname },
  } = props;

  useImperativeHandle(ref, () => ({
    open: onOpen,
    close: onClose,
  }));

  const onOpen = () => {
    const isFirstLogin = localStorage.getItem("first-login");
    if (isFirstLogin !== "true") {
      setVisible(true);
    }
  };

  const onClose = () => {
    setVisible();
    if (tabRef.current?.resetCode) tabRef.current.resetCode();
  };

  return (
    <Modal
      visible={visible}
      wrapClassName={styles.systemLicence}
      closable
      footer={null}
      onCancel={onClose}
      destroyOnClose
      width={580}
    >
      <Tabs defaultActiveKey="version">
        {tabs.map((item) => (
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
