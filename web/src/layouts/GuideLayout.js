import React, { useEffect, useState } from "react";
import { Layout, Spin, message } from "antd";
import styles from "./GuideLayout.less";
import logo from "../assets/logo.svg";
import { Link } from "umi";
import GlobalFooter from "@/components/GlobalFooter";
import SelectLang from "@/components/SelectLang";
import request from "@/utils/request";
import { router } from "umi";
import { formatMessage } from "umi/locale";
import { getHealth } from "@/services/system"

const { Header, Footer, Content } = Layout;

export default ({ children }) => {
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const res = await getHealth();
      if (!res?.setup_required) {
        router.push("/");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (loading) return <Spin spinning={loading} />;

  return (
    <Layout className={styles.container}>
      <Header className={styles.header}>
        <Link to="/guide">
          <img className={styles.logo} src={logo} alt="logo" />
        </Link>
        <div className={styles.desc}>
          {formatMessage({ id: "guide.header.title" })}
        </div>
        <div className={styles.action}>
          <SelectLang />
        </div>
      </Header>
      <Content className={styles.content}>{children}</Content>
      <Footer className={styles.footer}>
        <div className={styles.copyright}>
          ©{APP_AUTHOR}, All Rights Reserved.
        </div>
      </Footer>
    </Layout>
  );
};
