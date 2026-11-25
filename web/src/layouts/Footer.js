import React, { Fragment } from "react";
import { Layout, Icon } from "antd";
import GlobalFooter from "@/components/GlobalFooter";

const { Footer } = Layout;
const FooterView = () => (
  <Footer style={{ padding: 0 }}>
    <GlobalFooter
      links={[]}
      copyright={<Fragment key="footerCopyright">©{APP_AUTHOR}, All Rights Reserved.</Fragment>}
    />
  </Footer>
);
export default FooterView;
