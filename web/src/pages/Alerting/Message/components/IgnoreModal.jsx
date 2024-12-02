import { Modal, Form, Input } from "antd";
import { useCallback, useState, forwardRef, useMemo } from "react";
import useFetch from "@/lib/hooks/use_fetch";
import request from "@/utils/request";
import { router } from "umi";
import { formatMessage } from "umi/locale";

const { TextArea } = Input;

export default forwardRef((props, ref) => {
  const [requiredState, setRequiredState] = useState(false);
  useMemo(() => {
    setRequiredState(props.ignoreState.hasError);
  }, [props.ignoreState.hasError]);
  return (
    <Modal
      zIndex={1010}
      visible={props.ignoreState.visible}
      title={formatMessage(
        {
          id: "alert.message.detail.ignored.modal.title",
        },
        { num: props.ignoreState.items.length }
      )}
      onCancel={props.onCancel}
      onOk={props.onOk}
    >
      <TextArea
        defaultValue={""}
        rows={2}
        placeholder={formatMessage({
          id: "alert.message.detail.ignored.modal.input.placeholder",
        })}
        ref={ref}
        onChange={(e) => {
          if (e.target.value.length > 0) {
            setRequiredState(false);
          } else {
            setRequiredState(true);
          }
        }}
      />

      {requiredState ? (
        <div className="has-error" style={{ marginTop: 10 }}>
          <div className="ant-form-explain">
            {formatMessage({
              id: "alert.message.detail.ignored.modal.input.placeholder",
            })}
          </div>
        </div>
      ) : null}
    </Modal>
  );
});
