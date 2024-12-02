import styles from "./Licence.less";
import { Icon, Input, Button, Descriptions, message } from "antd";
import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { DATE_FORMAT } from ".";
import moment from "moment";
import request from "@/utils/request";
import { formatMessage } from "umi/locale";
import LicenceDesc from "./LicenceDesc";

export default ({ licence, onLicenceUpdate }, ref) => {
  const {
    license_type,
    license_id,
    issue_to = "-",
    issue_at,
    valid_from,
    expire_at,
    max_nodes = "-",
  } = licence || {};

  const [isEdit, setIsEdit] = useState(false);
  const [code, setCode] = useState();
  const [loading, setLoading] = useState(false);

  const onUpdate = async () => {
    if (code) {
      setLoading(true);
      const res = await request(
        "/_license/apply",
        {
          method: "POST",
          body: { license: code },
        },
        undefined,
        false
      );
      if (res?.acknowledged) {
        message.success("Licence update succeeded.");
        setIsEdit(false);
        onLicenceUpdate();
      } else {
        message.error("Licence update failed.");
      }
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    resetCode: () => {
      setIsEdit(false);
      setCode();
    },
  }));

  return (
    <div className={styles.licence}>
      <div className={styles.header}>
        <LicenceDesc licence={licence} />
      </div>
      <div className={styles.licenceBox}>
        {isEdit ? (
          <Input.TextArea
            rows={5}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
          />
        ) : (
          <div className={styles.edit}>
            <a onClick={() => setIsEdit(true)}>
              <Icon type="edit" />
            </a>
          </div>
        )}
      </div>
      <div className={styles.footer}>
        <Button
          loading={loading}
          type="primary"
          size="small"
          onClick={onUpdate}
        >
          {formatMessage({ id: "license.button.update_license" })}
        </Button>
      </div>
    </div>
  );
};
