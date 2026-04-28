import { Modal, Checkbox, Tag, Badge, Alert, Icon, Tooltip } from "antd";
import { useCallback, useState, forwardRef, useMemo } from "react";
import { FormattedMessage } from 'react-intl';
import useFetch from "@/lib/hooks/use_fetch";
import request from "@/utils/request";
import { router } from "umi";
import { formatMessage } from "umi/locale";

export default (props) => {
  const selectedCluster = props.selectedCluster || {};
  const selectedClusterId = selectedCluster?.id || "";
  const selectedClusterName =
    (typeof selectedCluster?.name === "string" && selectedCluster?.name) ||
    (typeof selectedCluster?.label === "string" && selectedCluster?.label) ||
    (typeof selectedCluster?.title === "string" && selectedCluster?.title) ||
    selectedClusterId;
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
      title={formatMessage(
        {
          id:
            len > 1
              ? "indices.delete.modal.title.batch"
              : "indices.delete.modal.title.single",
        },
        { count: len }
      )}
      onCancel={props.onCancel}
      onOk={props.onOk}
      okButtonProps={{ disabled: !props.deleteIndexConfirm }}
    >
      <p>
        <FormattedMessage
          id="indices.delete.modal.cluster"
          values={{
            cluster: <strong style={{ color: '#fa541c' }}>{selectedClusterName || selectedClusterId || "-"}</strong>
          }}
        />
        {selectedClusterId && selectedClusterName !== selectedClusterId ? (
          <>
            {" "}
            <Tooltip title={selectedClusterId}>
              <Icon type="info-circle" />
            </Tooltip>
          </>
        ) : null}
      </p>
      <ul style={{ maxHeight: 240, overflow: "scroll" }}>
        {props.items.map((item) => {
          return (
            <li key={item}>
              <Badge color="#353741" text={item} />{" "}
              {item.startsWith(".") ? (
                <Tag color="red">
                  <Icon type="warning" />{" "}
                  {formatMessage({ id: "indices.delete.modal.special_index" })}
                </Tag>
              ) : null}
            </li>
          );
        })}
      </ul>

      {hasSpecialIndex ? (
        <p>
          <Alert
            message={formatMessage({
              id: "indices.delete.modal.special_warning.title",
            })}
            description={formatMessage({
              id: "indices.delete.modal.special_warning.description",
            })}
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
              {formatMessage({
                id: "indices.delete.modal.special_warning.confirm",
              })}
            </Checkbox>
          </p>
        </p>
      ) : (
        <p style={{ color: "red" }}>
          {formatMessage({ id: "indices.delete.modal.description" })}
        </p>
      )}
    </Modal>
  );
};
