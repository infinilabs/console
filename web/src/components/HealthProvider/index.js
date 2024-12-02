import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Descriptions, Icon, Spin, message, Modal, Tooltip, Button } from 'antd';
import request from '@/utils/request';
import { router } from "umi";
import styles from './index.less';
import { formatMessage } from "umi/locale";
import { getHealth } from "@/services/system"

export default ({ children, location }) => {
  const [modalLoading, setModalLoading] = useState(false)

  const [health, setHealth] = useState()
  const [visible, setVisible] = useState(false)
  const intervalRef = useRef(null);

  const fetchHealth = async () => {
    try {
        setModalLoading(true)
        const res = await getHealth();
        if(res instanceof Error && res.name === "ERR_CONNECTION_REFUSED"){
          setHealth({})
          setModalLoading(false)
          return
        }
        setHealth(res);
        setModalLoading(false)
        if (res?.setup_required === true) {
          router.push("/guide/initialization");
        }
    } catch (error) {
        setModalLoading(false)
        console.log(error);
        message.error('Check servies health failed!')
    }
  }

  const checkStatus = (health) => {
    const { status } = health
    if (['green', 'yellow'].includes(status)) {
      setVisible(false)
    } else {
      setVisible(true)
    }
  }

  useEffect(() => {
    if (!location?.pathname || location?.pathname.includes('/guide/initialization')) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      setHealth()
      return;
    }
    if (!health) {
      fetchHealth()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      intervalRef.current = setInterval(() => {
        fetchHealth(true)
      }, [5*60*1000])
    }
  }, [location?.pathname, JSON.stringify(health)])

  useEffect(() => {
    if (health) {
      checkStatus(health)
    }
  }, [JSON.stringify(health)])

  useEffect(() => {
    if (health?.setup_required) {
      checkStatus(health)
    }
  }, [health?.setup_required])

  useEffect(() => {
    window.setGlobalHealth = setHealth;
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        window.setGlobalHealth = null;
      }
    }
  }, [])

  const services = useMemo(() => {
    if (!health || !health.services) return [];
    const servicesObj = health.services || {}
    const keys = Object.keys(servicesObj);
    return keys.map((key) => ({ service: key, health: servicesObj[key]}))
  }, [JSON.stringify(health)])

  const titleClick = () => {
    setVisible(false)
    router.push("/devtool/console");
  }
  return (
    <>
      {children}
      <Modal
          visible={visible}
          wrapClassName={styles.systemHealth}
          closable={false}
          footer={null}
        >
          <Spin spinning={modalLoading}>
            <div className={styles.title}>
              <Button type="link" style={{fontSize: '24px'}} onClick={titleClick}>{formatMessage({ id: 'health.modal.title'})}</Button>
              <a className={styles.refresh} onClick={fetchHealth}>
                <Icon title="refresh" type="reload" />
              </a>
            </div>
            <div className={styles.desc}>
              {health?.desc || formatMessage({ id: 'health.modal.desc'})}
            </div>
            <div className={styles.services}>
              <Descriptions title={formatMessage({ id: 'health.modal.services.title'})} colon={false} column={2}>
                {
                  services.map((item) => (
                    <Descriptions.Item 
                      key={item.service}
                      label={item.health === 'green' ? (
                        <span className={styles.greenIcon}></span>
                      ) : <Icon style={{ color: '#ff0000'}} type="close-circle" theme="filled" />}
                    >
                      {item.service}
                    </Descriptions.Item>
                  ))
                }
              </Descriptions>
            </div>
          </Spin>
      </Modal>
    </>
  );
};
