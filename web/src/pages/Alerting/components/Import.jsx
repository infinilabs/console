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
      message.success("Imported succeed!");
      if (onClose) onClose();
      if (onSuccess) onSuccess();
    } else {
      message.error("Imported failed!");
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
