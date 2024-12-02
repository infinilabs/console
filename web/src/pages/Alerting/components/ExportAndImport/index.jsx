import {
  Button,
  Drawer,
  Dropdown,
  Form,
  Icon,
  Menu,
  Select,
  Upload,
  message,
} from "antd";
import { useEffect, useState } from "react";
import styles from "./index.less";
import request from "@/utils/request";
import { Editor } from "@/components/monaco-editor";
import { formatMessage } from "umi/locale";

const FORM_ITEM_LAYOUT = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 18 },
  },
};

const EXPORT_TYPES = [
  {
    type: "AlertRule",
    name: formatMessage({ id: "app.export.type.alert.rule" }),
  },
  {
    type: "AlertChannel",
    name: formatMessage({ id: "app.export.type.alert.channel" }),
  },
  {
    type: "EmailServer",
    name: formatMessage({ id: "app.export.type.email.server" }),
  },
];

export default Form.create()((props) => {
  const { title, types = [], form, onSuccess, buttonAttr = {} } = props;

  const { getFieldDecorator } = form;

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionKey, setActionKey] = useState(props.actionKey || "");
  const [uploadState, setUploadState] = useState();

  const renderLabel = (key) => {
    if (!key) return "";
    return formatMessage({ id: `app.action.${key}` });
  };

  const handleMenuClick = ({ key }) => {
    setActionKey(key);
    setVisible(true);
  };

  const onExportSubmit = async (values) => {
    const { associatedTypes } = values;
    const allTypes = types.filter(
      (item) => item.isMain || associatedTypes.includes(item.type)
    );
    setLoading(true);
    const res = await request(`/data/export`, {
      method: "POST",
      body: {
        metadatas: allTypes.map((item) => ({ type: item.type })),
      },
    });
    if (res && !res.error) {
      const blob = new Blob([JSON.stringify(res, undefined, 2)], {
          type: "text/json",
        }),
        a = document.createElement("a");
      a.download = `console_${title.toLowerCase()}.json`;
      a.href = window.URL.createObjectURL(blob);
      a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
      a.click();
      a.remove();
      setVisible(false);
    }
    setLoading(false);
  };

  const onImportSubmit = async (values) => {
    if (!uploadState || !uploadState.data) return;
    setLoading(true);
    const res = await request(`/data/import`, {
      method: "POST",
      body: uploadState.data,
    });
    if (res?.acknowledged) {
      message.success("Upload succeed!");
      setVisible(false);
      if (onSuccess) onSuccess();
    } else {
      message.error("Upload failed!");
    }
    setLoading(false);
  };

  const onSubmit = (key) => {
    form.validateFields((err, values) => {
      if (err) {
        return false;
      }
      if (key === "export") {
        onExportSubmit(values);
        return;
      }
      if (key === "import") {
        onImportSubmit(values);
        return;
      }
    });
  };

  const renderExportBody = () => {
    const associatedTypes = types
      .filter((item) => !item.isMain)
      .map((item) => {
        const type = EXPORT_TYPES.find((et) => et.type === item.type);
        return {
          ...item,
          ...(type || {}),
        };
      });
    return (
      <>
        <Form.Item
          label={formatMessage({ id: "app.export.form.associated.data" })}
          help={formatMessage({ id: "app.export.form.associated.data.help" })}
        >
          {getFieldDecorator("associatedTypes", {
            initialValue: associatedTypes.map((item) => item.type),
          })(
            <Select mode="multiple">
              {associatedTypes.map((item) => (
                <Select.Option key={item.type} value={item.type}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          )}
        </Form.Item>
      </>
    );
  };

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    setUploadState({
      ...(uploadState || {}),
      fileList: [e.file],
    });
    return e && e.fileList;
  };

  const renderImportBody = () => {
    const uploadProps = {
      accept: "application/json",
      fileList: uploadState?.fileList || [],
      multiple: false,
      name: "file",
      onChange(info) {
        if (info.file.status !== "uploading") {
          //cat json content
          let reader = new FileReader();
          reader.onload = (e) => {
            const jsonStr = e.target.result;
            try {
              const jsonObj = JSON.parse(jsonStr);
              setUploadState({
                ...(uploadState || {}),
                data: jsonObj,
              });
            } catch {
              message.error(`${info.file.name} is an invalid json file!`);
            }
          };
          reader.readAsText(info.file.originFileObj);
        }
        if (info.file.status === "done") {
          message.success(`${info.file.name} file uploaded successfully`);
        } else if (info.file.status === "error") {
          message.error(`${info.file.name} file upload failed.`);
        }
      },
    };

    let data;

    try {
      if (uploadState?.data) {
        data = JSON.stringify(uploadState.data, null, 2);
      }
    } catch {}

    return (
      <>
        <Form.Item label={formatMessage({ id: "app.export.form.file" })}>
          {getFieldDecorator("upload", {
            getValueFromEvent: normFile,
            rules: [
              {
                required: true,
                message: "Please select file",
              },
            ],
          })(
            <Upload {...uploadProps}>
              <Button>
                <Icon type="upload" />{" "}
                {formatMessage({ id: "app.export.form.file.button" })}
              </Button>
            </Upload>
          )}
        </Form.Item>
        {data && (
          <Editor
            height="calc(100vh - 110px - 70px - 48px)"
            language="json"
            theme="light"
            value={data}
            options={{
              minimap: {
                enabled: false,
              },
              wordBasedSuggestions: true,
            }}
            onChange={(value) => {
              try {
                const jsonObj = JSON.parse(value);
                setUploadState({
                  ...(uploadState || {}),
                  data: jsonObj,
                });
              } catch {}
            }}
          />
        )}
      </>
    );
  };

  const onClose = () => {
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) {
      if (!props.actionKey) {
        setActionKey();
      }
      setUploadState();
    }
  }, [visible, props.actionKey]);

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="export">
        <Icon type="download" />
        {`${renderLabel("export")} ${title}`}
      </Menu.Item>
      <Menu.Item key="import">
        <Icon type="upload" />
        {`${renderLabel("import")} ${title}`}
      </Menu.Item>
    </Menu>
  );

  let body;

  if (actionKey) {
    body = actionKey === "export" ? renderExportBody() : renderImportBody();
  }

  const RenderButton = ({ actionKey }) => {
    switch (actionKey) {
      case "import":
        return (
          <Button
            type={buttonAttr.type || "default"}
            icon="upload"
            onClick={() => {
              setVisible(true);
            }}
          >
            {buttonAttr.text || formatMessage({ id: "app.action.import" })}
          </Button>
        );
      case "export":
        return (
          <Button
            type={buttonAttr.type || "default"}
            icon="download"
            onClick={() => {
              setVisible(true);
            }}
          >
            {buttonAttr.text || formatMessage({ id: "app.action.export" })}
          </Button>
        );
      default:
        return (
          <Dropdown overlay={menu}>
            <Button>
              {formatMessage({ id: "app.action.export" })}/
              {formatMessage({ id: "app.action.import" })} <Icon type="down" />
            </Button>
          </Dropdown>
        );
    }
  };

  return (
    <>
      <RenderButton actionKey={actionKey} />
      <Drawer
        title={`${renderLabel(actionKey)} ${title}`}
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
        <div style={{ padding: 24, height: "100%" }}>
          <Form {...FORM_ITEM_LAYOUT} colon={false}>
            {body}
          </Form>
        </div>
        <div className={styles.actions}>
          <Button style={{ marginRight: 12 }} onClick={onClose}>
            {formatMessage({ id: "form.button.cancel" })}
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={() => onSubmit(actionKey)}
          >
            {formatMessage({ id: "form.button.submit" })}
          </Button>
        </div>
      </Drawer>
    </>
  );
});
