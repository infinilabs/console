import { Modal, Checkbox, Tag, Badge, Alert, Icon } from "antd";
import { useCallback, useState, forwardRef, useMemo } from "react";
import useFetch from "@/lib/hooks/use_fetch";
import request from "@/utils/request";
import { router } from "umi";
import { formatMessage } from "umi/locale";

export default (props) => {
  const [len, hasSpecialIndex] = useMemo(() => {
    let items = props.items;
    let len = items.length;
    let hasSpecialIndex = false;
    for (let item of items) {
      if (item.startsWith(".")) {
        hasSpecialIndex = true;
        break;
      }
    }
    return [len, hasSpecialIndex];
  }, [props.items]);

  return (
    <Modal
      width={600}
      visible={props.visible}
      title={len > 1 ? `Delete ${len} indices` : "Delete index"}
      onCancel={props.onCancel}
      onOk={props.onOk}
      okButtonProps={{ disabled: !props.deleteIndexConfirm }}
    >
      <p>You are about to delete these indices:</p>
      <ul style={{ maxHeight: 240, overflow: "scroll" }}>
        {props.items.map((item) => {
          return (
            <li key={item}>
              <Badge color="#353741" text={item} />{" "}
              {item.startsWith(".") ? (
                <Tag color="red">
                  <Icon type="warning" /> Special index
                </Tag>
              ) : null}
            </li>
          );
        })}
      </ul>

      {hasSpecialIndex ? (
        <p>
          <Alert
            message="Deleting a special index can break Console!"
            description="Special indices are critical for internal operations. If you delete a special index, you can't recover it. Make sure you have appropriate backups."
            type="error"
          />
          <p style={{ paddingTop: 10 }}>
            <Checkbox
              onChange={(e) => {
                if (
                  typeof props.onChangeDeleteIndexConfirmState == "function"
                ) {
                  props.onChangeDeleteIndexConfirmState(e.target.checked);
                }
              }}
            >
              I understand the consequences of deleting a special index
            </Checkbox>
          </p>
        </p>
      ) : (
        <p>
          You can't recover a deleted index. Make sure you have appropriate
          backups.
        </p>
      )}
    </Modal>
  );
};
