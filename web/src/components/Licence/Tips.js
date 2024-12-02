import { useEffect, useMemo, useState } from "react";
import { Icon, Result } from "antd";
import moment from "moment";
import styles from "./Tips.less";
import Features from "./Features";
import Buy from "./Buy";
import { formatMessage } from "umi/locale";
import { LICENCE_ROUTES } from ".";

export default (props) => {
  const licence = props.licence;
  const { license_type, expire_at } = licence;
  const needProLicense = LICENCE_ROUTES.some((item) =>
    props.location.pathname.includes(item)
  );

  const renderHeader = () => {
    if (moment(expire_at).diff(moment(), "seconds") < 0) {
      return (
        <Result
          className={styles.content}
          status="error"
          title={formatMessage({ id: "license.tips.expired.title" })}
          subTitle={formatMessage({ id: "license.tips.expired.desc" })}
          icon={<Icon type="clock-circle" />}
        />
      );
    }

    //pro Edition
    if (needProLicense) {
      return (
        <Result
          className={styles.content}
          status="warning"
          title={formatMessage({ id: "license.tips.pro.title" })}
          subTitle={formatMessage({ id: "license.tips.pro.desc" })}
          icon={<Icon type="sketch" />}
        />
      );
    }
    return (
      <Result
        className={styles.content}
        status="error"
        title={formatMessage({ id: "license.tips.unlicensed.title" })}
        subTitle={formatMessage({ id: "license.tips.unlicensed.desc" })}
        icon={<Icon type="close-circle" />}
      />
    );
  };

  return (
    <div className={styles.tips}>
      <div className={styles.header}>{renderHeader()}</div>
      <Features licence={licence} />
      <Buy trialVisible={!needProLicense} {...props} />
    </div>
  );
};
