import {
  Button,
  Drawer,
  Dropdown,
  Form,
  Icon,
  Menu,
  Select,
  Tooltip,
  Upload,
  message,
} from "antd";
import { useEffect, useState } from "react";
import request from "@/utils/request";
import { Editor } from "@/components/monaco-editor";
import { formatMessage } from "umi/locale";
import ExportAndImportDrawer from "../components/ExportAndImportDrawer";

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

export default Form.create()((props) => {
  const {
    visible = false,
    title,
    types = [],
    exampleType,
    form,
    onSuccess,
    onClose,
  } = props;

  const { getFieldDecorator } = form;
  const [loading, setLoading] = useState(false);
  const [uploadState, setUploadState] = useState();

  const renderLabel = (key) => {
    if (!key) return "";
    return formatMessage({ id: `app.action.${key}` });
  };

  const onImportSubmit = async (values) => {
    if (!uploadState || !uploadState.data) return;
    setLoading(true);
    const res = await request(`/data/import`, {
      method: "POST",
      body: uploadState.data,
    });
    if (res?.acknowledged) {
      message.success(formatMessage({ id: "alert.import.submit.success" }));
      if (onClose) onClose();
      if (onSuccess) onSuccess();
    } else {
      message.error(formatMessage({ id: "alert.import.submit.failed" }));
    }
    setLoading(false);
  };

  const onSubmit = (key) => {
    form.validateFields((err, values) => {
      if (err) {
        return false;
      }
      onImportSubmit(values);
    });
  };

  const clearUploadState = () => {
    setUploadState((prev) => ({
      ...(prev || {}),
      fileList: [],
      data: undefined,
    }));
    form.setFieldsValue({
      upload: [],
    });
  };

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    const fileList = e?.fileList ? e.fileList.slice(-1) : [];
    setUploadState((prev) => ({
      ...(prev || {}),
      fileList,
      ...(fileList.length === 0 ? { data: undefined } : {}),
    }));
    return fileList;
  };

  const renderImportBody = () => {
    const alertRuleExample = `{
  "metadatas": [
    {
      "type": "AlertRule",
      "items": [
        {
          "id": "rule_cpu_high",
          "name": "CPU High Alert",
          "enabled": true,
          "resource_id": "your_cluster_id",
          "priority": "critical"
        }
      ]
    },
    {
      "type": "AlertChannel",
      "items": [
        {
          "id": "channel_email_default",
          "name": "Default Email Channel"
        }
      ]
    }
  ]
}`;
    const showRuleExample = false;
    //const showRuleExample = exampleType === "AlertRule";
    const uploadProps = {
      accept: "application/json",
      fileList: uploadState?.fileList || [],
      multiple: false,
      name: "file",
      onRemove() {
        clearUploadState();
        return true;
      },
      onChange(info) {
        const fileList = info?.fileList ? info.fileList.slice(-1) : [];
        if (info.file.status === "removed" || fileList.length === 0) {
          clearUploadState();
          return;
        }
        if (info.file.status !== "uploading") {
          //cat json content
          let reader = new FileReader();
          reader.onload = (e) => {
            const jsonStr = e.target.result;
            try {
              const jsonObj = JSON.parse(jsonStr);
              setUploadState((prev) => ({
                ...(prev || {}),
                fileList,
                data: jsonObj,
              }));
            } catch {
              message.error(formatMessage({ id: "alert.import.upload.invalid_json" }));
            }
          };
          reader.readAsText(info.file.originFileObj);
        }
        if (info.file.status === "done") {
          message.success(formatMessage({ id: "alert.import.upload.success" }));
        } else if (info.file.status === "error") {
          message.error(formatMessage({ id: "alert.import.upload.failed" }));
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
      <div>
        {showRuleExample ? (
          <>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span>{formatMessage({ id: "alert.import.example.title" })}</span>
              <Tooltip title={formatMessage({ id: "alert.import.example.tip.rule" })}>
                <Icon type="info-circle" style={{ color: "rgba(0,0,0,0.45)" }} />
              </Tooltip>
            </div>
            <Editor
              height="260px"
              language="json"
              theme="light"
              value={alertRuleExample}
              options={{
                minimap: {
                  enabled: false,
                },
                readOnly: true,
                scrollBeyondLastLine: false,
                scrollbar: {
                  vertical: "hidden",
                  horizontal: "hidden",
                },
              }}
            />
            <div style={{ height: 12 }} />
          </>
        ) : null}
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
            height={showRuleExample ? "calc(100vh - 420px)" : "calc(100vh - 110px - 70px - 48px)"}
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
      </div>
    );
  };

  useEffect(() => {
    if (!visible) {
      setUploadState();
    }
  }, [visible]);

  return (
    <ExportAndImportDrawer
      title={`${renderLabel("import")}${title}`}
      onClose={onClose}
      visible={visible}
      loading={loading}
      onSubmit={onSubmit}
    >
      <Form {...FORM_ITEM_LAYOUT} colon={false}>
        {renderImportBody()}
      </Form>
    </ExportAndImportDrawer>
  );
});
