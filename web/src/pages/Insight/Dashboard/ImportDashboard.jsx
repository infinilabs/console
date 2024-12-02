import request from "@/utils/request";
import {
  Upload,
  Button,
  Drawer,
  Form,
  Icon,
  Input,
  message,
  Select,
  Spin,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { ESPrefix } from "@/services/common";
import { formatMessage } from "umi/locale";

import { isJSONString } from "@/utils/utils";
import { Editor } from "@/components/monaco-editor";
import { isFunction } from "lodash";

const { TextArea } = Input;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 3 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 19 },
  },
};

export default Form.create()((props) => {
  const { form, onSubmitSuccess, isAdmin } = props;
  const { getFieldDecorator } = form;
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [fileList, setFileList] = useState([]);

  const onNameChange = (e) => {
    if (JSON.stringify(data) !== "{}") {
      setData({ ...data, name: e.target.value });
    }
  };

  const uploadProps = {
    accept: "application/json",
    fileList: fileList,
    multiple: false,
    name: "file",
    onChange(info) {
      if (info.file.status !== "uploading") {
        //cat json content
        let reader = new FileReader();
        reader.onload = (e) => {
          let jsonStr = e.target.result;
          if (!isJSONString(jsonStr)) {
            message.error(`${info.file.name} is an invalid json file!`);
            return;
          }
          let jsonObj = JSON.parse(jsonStr);
          form.setFieldsValue({ name: jsonObj.name });
          setData(jsonObj);
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
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    //Keep only one file on fileList
    setFileList([e.file]);
    return e && e.fileList;
  };

  const handleSave = () => {
    form.validateFields(async (err, values) => {
      if (err) {
        return false;
      }
      if (!data?.config || !data?.name) {
        message.error(
          formatMessage({ id: "dashboard.workspace.import.upload.required" })
        );
        return false;
      }
      setLoading(true);
      const res = await request(`/layout`, {
        method: "POST",
        body: { ...data, type: "workspace", is_fixed: true },
      });
      if (res?.result === "created") {
        message.success(formatMessage({ id: "app.message.import.success" }));

        closeDrawer();
        onSubmitSuccess();
      } else {
        message.error(formatMessage({ id: "app.message.import.failed" }));
      }
      setLoading(false);
    });
  };

  const closeDrawer = () => {
    setVisible(false);
    setData({});
  };

  return (
    <>
      <a onClick={() => setVisible(true)} disabled={!isAdmin}>
        <Icon type={"upload"} />{" "}
        {formatMessage({ id: "dashboard.workspace.button.import" })}
      </a>
      <Drawer
        title={formatMessage({ id: "dashboard.workspace.import.title" })}
        placement="right"
        onClose={() => closeDrawer()}
        visible={visible}
        width={700}
        destroyOnClose
      >
        <Spin spinning={loading}>
          <Form {...formItemLayout} colon={false}>
            <Form.Item
              label={formatMessage({
                id: "dashboard.workspace.import.upload.field",
              })}
            >
              {getFieldDecorator("upload", {
                getValueFromEvent: normFile,
                rules: [
                  {
                    required: true,
                    message: formatMessage({
                      id: "dashboard.workspace.import.upload.required",
                    }),
                  },
                ],
              })(
                <Upload {...uploadProps}>
                  <Button>
                    <Icon type="upload" />{" "}
                    {formatMessage({
                      id: "dashboard.workspace.import.upload.text",
                    })}
                  </Button>
                </Upload>
              )}
            </Form.Item>
            <Form.Item
              label={formatMessage({
                id: "dashboard.workspace.import.name.field",
              })}
            >
              {getFieldDecorator("name", {
                initialValue: "",
                rules: [
                  {
                    required: true,
                    message: formatMessage({
                      id: "dashboard.workspace.import.name.required",
                    }),
                  },
                ],
              })(
                <Input
                  placeholder={formatMessage({
                    id: "dashboard.workspace.import.name.placeholder",
                  })}
                  maxLength={30}
                  onChange={onNameChange}
                />
              )}
            </Form.Item>
            {JSON.stringify(data) !== "{}" ? (
              <>
                <Editor
                  height="400px"
                  language="json"
                  theme="light"
                  value={JSON.stringify(data, null, 2)}
                  options={{
                    minimap: {
                      enabled: false,
                    },
                    wordBasedSuggestions: true,
                  }}
                />
              </>
            ) : null}

            <Form.Item label=" ">
              <div style={{ display: "flex", justifyContent: "right" }}>
                <Button type="primary" loading={loading} onClick={handleSave}>
                  {formatMessage({ id: "form.button.submit" })}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Spin>
      </Drawer>
    </>
  );
});
