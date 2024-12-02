import { Button, Drawer } from "antd";
import { formatMessage } from "umi/locale";

export default (props) => {
  const {
    loading,
    visible = false,
    title,
    onSubmit,
    onClose,
    children,
  } = props;

  return (
    <Drawer
      title={title}
      placement="right"
      onClose={onClose}
      visible={visible}
      width={700}
      bodyStyle={{
        padding: 0,
        height: "calc(100vh - 110px)",
        overflow: "auto",
      }}
      destroyOnClose
    >
      <div style={{ padding: 24, height: "100%" }}>{children}</div>
      <div
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: "100%",
          padding: "11px 16px",
          backgroundColor: "#ffffff",
          textAlign: "right",
          borderTop: "1px solid #e9e9e9",
        }}
      >
        <Button style={{ marginRight: 12 }} onClick={onClose}>
          {formatMessage({ id: "form.button.cancel" })}
        </Button>
        <Button type="primary" loading={loading} onClick={() => onSubmit()}>
          {formatMessage({ id: "form.button.submit" })}
        </Button>
      </div>
    </Drawer>
  );
};
